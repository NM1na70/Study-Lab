// Import transactional storage, deterministic marking and persisted session contracts
import { randomUUID } from 'node:crypto';
import type { DatabaseSync } from 'node:sqlite';
import type { Lesson, Mutation, Progress, Task } from '../shared/schema.js';
import {
  DomainError,
  emptyTask,
  mark,
  validateAnswer,
} from '../shared/domain.js';
import {
  nextSchedule,
  type Schedule,
  type ReviewSession,
  type ReviewMutation,
  type ReviewSnapshot,
} from '../shared/review.js';

// Keep review outcomes separate from original lesson answers, attempts and completions
export class Reviews {
  constructor(
    private db: DatabaseSync,
    private lessons: Lesson[],
    private clock: () => Date = () => new Date(),
  ) {}

  // Reject concept or content-version mismatches rather than grading against different material
  private task(schedule: Schedule): Task {
    const lesson = this.lessons.find(
      (lesson) => lesson.id === schedule.lessonId,
    );
    const task = lesson?.tasks.find((task) => task.id === schedule.taskId);
    if (
      !lesson ||
      !task ||
      task.reviewConcept !== schedule.concept ||
      lesson.version !== schedule.contentVersion
    )
      throw new DomainError(
        'Review content changed — open the current lesson before reviewing',
        409,
      );
    return task;
  }

  // Read and write concept schedules separately from session drafts and immutable results
  private all(): Schedule[] {
    return this.db
      .prepare('SELECT state FROM review_schedule')
      .all()
      .map((row) => JSON.parse(String(row.state)) as Schedule);
  }
  private put(schedule: Schedule) {
    this.db
      .prepare(
        'INSERT INTO review_schedule VALUES (?,?) ON CONFLICT(concept) DO UPDATE SET state=excluded.state',
      )
      .run(schedule.concept, JSON.stringify(schedule));
  }
  private session(id: string): ReviewSession {
    const row = this.db
      .prepare('SELECT state FROM review_sessions WHERE id=?')
      .get(id);
    if (!row) throw new DomainError('Review session not found', 404);
    return JSON.parse(String(row.state)) as ReviewSession;
  }
  private write(session: ReviewSession) {
    this.db
      .prepare(
        'INSERT INTO review_sessions VALUES (?,?) ON CONFLICT(id) DO UPDATE SET state=excluded.state',
      )
      .run(session.id, JSON.stringify(session));
  }

  // Seed only observed lesson history, never invented past review successes
  seed(lesson: Lesson, progress: Progress) {
    for (const schedule of this.all().filter(
      (schedule) =>
        schedule.lessonId === lesson.id &&
        schedule.contentVersion !== lesson.version,
    )) {
      if (
        lesson.tasks.some(
          (task) =>
            task.id === schedule.taskId &&
            task.reviewConcept === schedule.concept,
        )
      )
        this.put({ ...schedule, contentVersion: lesson.version });
    }
    for (const task of lesson.tasks) {
      if (!task.reviewConcept || ['written', 'report'].includes(task.kind))
        continue;
      const state = progress.tasks[task.id];
      if (
        !state ||
        !state.attempts ||
        (!state.correct && !state.mistakes) ||
        this.all().some((schedule) => schedule.concept === task.reviewConcept)
      )
        continue;
      const dismissed =
        (state.reviewDismissedMistakes ?? 0) > 0 &&
        state.mistakes <= (state.reviewDismissedMistakes ?? 0);
      this.put({
        concept: task.reviewConcept,
        lessonId: lesson.id,
        taskId: task.id,
        contentVersion: lesson.version,
        level: 0,
        dueAt: new Date(
          this.clock().getTime() +
            (state.correct && !state.hints && !state.solution ? 86_400_000 : 0),
        ).toISOString(),
        dismissed,
        assistedUntil:
          state.hints > 0 || state.solution
            ? new Date(this.clock().getTime() + 3_600_000).toISOString()
            : undefined,
      });
    }
  }

  // Carry recent assistance into recall and reactivate dismissal only for a new mistake or explicit restore
  lessonChanged(lesson: Lesson, progress: Progress, mutation: Mutation) {
    this.seed(lesson, progress);
    const task = lesson.tasks.find((task) => task.id === mutation.taskId);
    if (!task?.reviewConcept) return;
    const schedule = this.all().find(
      (schedule) => schedule.concept === task.reviewConcept,
    );
    if (!schedule) return;
    if (['hint', 'solution'].includes(mutation.action)) {
      this.put({
        ...schedule,
        assistedUntil: new Date(
          this.clock().getTime() + 3_600_000,
        ).toISOString(),
      });
      for (const session of this.snapshot().active)
        if (
          session.items.some(
            (item) => item.concept === task.reviewConcept && !item.recorded,
          )
        ) {
          for (const item of session.items)
            if (item.concept === task.reviewConcept && !item.recorded)
              item.assisted = true;
          session.revision++;
          this.write(session);
        }
    }
    if (mutation.action === 'check' && !progress.tasks[task.id].correct)
      this.put({
        ...schedule,
        level: 0,
        dueAt: this.clock().toISOString(),
        dismissed: false,
      });
    if (mutation.action === 'dismissReview')
      this.put({ ...schedule, dismissed: true });
    if (mutation.action === 'restoreReview')
      this.put({ ...schedule, dismissed: false });
  }

  // Derive due work from server UTC time while retaining unfinished sessions for resumption
  snapshot(): ReviewSnapshot {
    const now = this.clock().toISOString();
    return {
      now,
      due: this.all()
        .filter((item) => !item.dismissed && item.dueAt <= now)
        .sort(
          (a, b) =>
            a.dueAt.localeCompare(b.dueAt) ||
            a.concept.localeCompare(b.concept),
        ),
      count: this.all().filter((item) => !item.dismissed && item.dueAt <= now)
        .length,
      active: this.db
        .prepare('SELECT state FROM review_sessions')
        .all()
        .map((row) => JSON.parse(String(row.state)) as ReviewSession)
        .filter((session) => !session.finishedAt),
    };
  }

  // Share the persistent dismissal marker while retaining original answers and assessment history
  private marker(schedule: Schedule, value: number): number {
    const row = this.db
      .prepare('SELECT state FROM progress WHERE lesson_id=?')
      .get(schedule.lessonId);
    if (!row)
      throw new DomainError('Original lesson progress is unavailable', 409);
    const progress = JSON.parse(String(row.state)) as Progress;
    const state = progress.tasks[schedule.taskId];
    if (!state)
      throw new DomainError('Original activity progress is unavailable', 409);
    const previous = state.reviewDismissedMistakes ?? 0;
    state.reviewDismissedMistakes = value;
    progress.revision++;
    progress.updatedAt = this.clock().toISOString();
    this.db
      .prepare('UPDATE progress SET state=? WHERE lesson_id=?')
      .run(JSON.stringify(progress), schedule.lessonId);
    return previous;
  }

  // Resume unfinished sessions and cap each new session at five distinct concepts
  start(course: string): ReviewSession {
    const snapshot = this.snapshot();
    const active = snapshot.active.find((session) => session.course === course);
    if (active) return active;
    const due = snapshot.due
      .filter(
        (item) =>
          this.lessons.find((lesson) => lesson.id === item.lessonId)?.course ===
          course,
      )
      .slice(0, 5);
    if (!due.length) throw new DomainError('No Reviews Due');
    const session: ReviewSession = {
      id: randomUUID(),
      course,
      revision: 0,
      index: 0,
      items: due.map((schedule) => ({
        concept: schedule.concept,
        state: emptyTask(this.task(schedule)),
        recorded: false,
        assisted:
          !!schedule.assistedUntil &&
          schedule.assistedUntil > this.clock().toISOString(),
        skipped: false,
      })),
      finishedAt: null,
    };
    this.write(session);
    return session;
  }

  // Commit one result and one schedule change atomically; revisions prevent duplicate advances
  update(id: string, mutation: ReviewMutation): ReviewSession {
    this.db.exec('BEGIN IMMEDIATE');
    try {
      const session = this.session(id);
      if (session.revision !== mutation.revision || session.finishedAt)
        throw new DomainError(
          'Review changed — copy unsaved text before reloading to resume recorded results',
          409,
        );
      const item = session.items[session.index];

      // Restore the removed schedule and dismissal watermark together, without erasing assessment history
      if (mutation.action === 'undo') {
        const removed = session.removed;
        const current =
          removed &&
          this.all().find((schedule) => schedule.concept === removed.concept);
        if (!removed || !current?.dismissed)
          throw new DomainError('This removal can no longer be undone', 409);
        this.put(removed.schedule);
        this.marker(removed.schedule, removed.previousMarker);
        session.index = removed.index;
        session.items[removed.index].skipped = false;
        session.removed = undefined;
      } else if (mutation.action === 'finish')
        session.finishedAt = this.clock().toISOString();
      else {
        if (!item) throw new DomainError('Finish this review session');
        const schedule = this.all().find(
          (schedule) => schedule.concept === item.concept,
        );
        if (
          !schedule ||
          (schedule.dismissed &&
            !['draft', 'skip', 'next'].includes(mutation.action))
        )
          throw new DomainError(
            'This review item was removed — finish this session and start another',
            409,
          );
        const task = this.task(schedule);
        switch (mutation.action) {
          case 'dismiss': {
            const original = this.db
              .prepare('SELECT state FROM progress WHERE lesson_id=?')
              .get(schedule.lessonId);
            const state = original
              ? (JSON.parse(String(original.state)) as Progress).tasks[
                  schedule.taskId
                ]
              : undefined;
            if (!state)
              throw new DomainError('Original activity is unavailable', 409);
            const previousMarker = this.marker(schedule, state.mistakes);
            session.removed = {
              concept: schedule.concept,
              index: session.index,
              schedule: structuredClone(schedule),
              previousMarker,
            };
            this.put({ ...schedule, dismissed: true });
            if (!item.recorded) item.skipped = true;
            session.index++;
            break;
          }
          case 'draft':
            if (
              item.recorded ||
              mutation.answer === undefined ||
              !validateAnswer(task, mutation.answer)
            )
              throw new DomainError(
                'Review answer cannot be changed after recording',
              );
            item.state.answer = mutation.answer;
            break;
          case 'hint':
            if (item.recorded)
              throw new DomainError('This result is already recorded', 409);
            item.assisted = true;
            this.put({
              ...schedule,
              assistedUntil: new Date(
                this.clock().getTime() + 3_600_000,
              ).toISOString(),
            });
            if (!item.recorded)
              item.state.hints = Math.min(
                task.hints.length,
                item.state.hints + 1,
              );
            break;
          case 'solution':
            if (item.recorded)
              throw new DomainError('This result is already recorded', 409);
            item.assisted = true;
            this.put({
              ...schedule,
              assistedUntil: new Date(
                this.clock().getTime() + 3_600_000,
              ).toISOString(),
            });
            if (!item.recorded) item.state.solution = true;
            break;

          // Record one recall result and reschedule it without changing original lesson attempts
          case 'check': {
            if (item.recorded)
              throw new DomainError(
                'This review result is already recorded',
                409,
              );
            if (
              !validateAnswer(task, item.state.answer) ||
              (typeof item.state.answer === 'string' &&
                !item.state.answer.trim()) ||
              (Array.isArray(item.state.answer) && !item.state.answer.length)
            )
              throw new DomainError('Enter a review answer');
            item.state.correct = mark(task, item.state.answer);
            item.state.attempts = 1;
            item.state.checked = true;
            item.recorded = true;
            const next = nextSchedule(
              schedule,
              item.state.correct,
              !!item.assisted || item.state.hints > 0 || item.state.solution,
              this.clock(),
            );
            this.db.prepare('INSERT INTO review_results VALUES (?,?,?)').run(
              session.id,
              item.concept,
              JSON.stringify({
                answer: item.state.answer,
                correct: item.state.correct,
                assisted:
                  !!item.assisted ||
                  item.state.hints > 0 ||
                  item.state.solution,
                checkedAt: this.clock().toISOString(),
                nextDue: next.dueAt,
              }),
            );
            this.put(next);
            item.nextDue = next.dueAt;
            break;
          }
          case 'next':
            if (!item.recorded)
              throw new DomainError('Check or explicitly skip this item first');
            session.index++;
            break;

          // Leave skipped concepts due and avoid inventing a recall result
          case 'skip':
            if (item.recorded)
              throw new DomainError('This result is already recorded');
            item.skipped = true;
            session.index++;
            break;
        }
      }
      session.revision++;
      this.write(session);
      this.db.exec('COMMIT');
      return session;
    } catch (error) {
      this.db.exec('ROLLBACK');
      throw error;
    }
  }
}
