// Select stable catalogue references while keeping all answers in ordinary lesson progress
import { randomUUID } from 'node:crypto';
import type { Lesson } from '../shared/schema.js';
import type { Store } from './store.js';
import { lessons } from '../shared/lessons.js';
import { DomainError, taskSatisfied } from '../shared/domain.js';

// Store only catalogue identities and presentation estimates; answers stay in lesson progress
export interface QuizItem {
  lessonId: string;
  taskId: string;
  version: number;
  minutes: number;
  difficulty: string;
}
export interface QuizSession {
  id: string;
  revision: number;
  createdAt: string;
  items: QuizItem[];
}

// Prefer two short questions and two substantial questions per course, then use the available medium work
export function selectQuiz(
  store: Store,
  previous: QuizItem[] = [],
  catalogue: Lesson[] = lessons,
): QuizItem[] {
  // Exclude satisfied questions using the same factual and self-review requirements as lessons
  const pool = catalogue.flatMap((lesson) => {
    const progress = store.get(lesson);
    return lesson.tasks
      .filter((task) => !taskSatisfied(task, progress.tasks[task.id]))
      .map((task) => ({
        lessonId: lesson.id,
        taskId: task.id,
        version: lesson.version,
        minutes: task.quiz?.minutes ?? 3,
        difficulty: task.quiz?.difficulty ?? 'Medium',
      }));
  });
  const avoided = (item: QuizItem) =>
    previous.some(
      (old) => old.lessonId === item.lessonId && old.taskId === item.taskId,
    )
      ? 1
      : 0;
  pool.sort(
    (a, b) =>
      avoided(a) - avoided(b) ||
      (a.difficulty === 'Hard' && b.difficulty === 'Hard'
        ? Math.abs(a.minutes - 22) - Math.abs(b.minutes - 22)
        : 0),
  );
  const selected = ['English', 'Cybersecurity'].flatMap((course) => {
    let available = pool.filter(
      (item) =>
        catalogue.find((lesson) => lesson.id === item.lessonId)?.course ===
        course,
    );

    // Separate new candidates from the previous selection before applying per-course quotas
    const alternatives = available.filter((item) => !avoided(item));
    const repeated = available.filter((item) => avoided(item));
    available = alternatives;
    const chosen: QuizItem[] = [];
    const counts = new Map<string, number>();
    for (const row of store.db.prepare('SELECT state FROM quiz_history').all())
      for (const item of (JSON.parse(String(row.state)) as QuizSession).items) {
        const key = item.lessonId + ':' + item.taskId;
        counts.set(key, (counts.get(key) ?? 0) + 1);
      }
    for (const [difficulty, count] of [
      ['Easy', 2],
      ['Hard', 2],
      ['Medium', 2],
    ] as const) {
      for (const item of available
        .filter((item) => item.difficulty === difficulty)
        .sort(
          (a, b) =>
            avoided(a) - avoided(b) ||
            (counts.get(a.lessonId + ':' + a.taskId) ?? 0) -
              (counts.get(b.lessonId + ':' + b.taskId) ?? 0) ||
            (difficulty === 'Hard'
              ? Math.abs(a.minutes - 22) - Math.abs(b.minutes - 22)
              : 0),
        )
        .slice(0, count)) {
        if (chosen.length < 4) chosen.push(item);
      }
    }
    for (const item of available)
      if (chosen.length < 4 && !chosen.includes(item)) chosen.push(item);

    // Reuse unfinished questions only after every available alternative has been considered
    for (const item of repeated) if (chosen.length < 4) chosen.push(item);
    return chosen;
  });

  // Add genuine Medium work only when it brings a bounded session closer to the duration aim
  for (let extra = 0; extra < 2; extra++) {
    const total = selected.reduce((sum, item) => sum + item.minutes, 0);
    const next = pool
      .filter(
        (item) =>
          item.difficulty === 'Medium' &&
          !avoided(item) &&
          !selected.includes(item),
      )
      .sort(
        (a, b) =>
          Math.abs(90 - total - a.minutes) - Math.abs(90 - total - b.minutes),
      )[0];
    if (!next || Math.abs(90 - total - next.minutes) >= Math.abs(90 - total))
      break;
    selected.push(next);
  }
  return selected;
}

// Replace the selection transactionally and archive the old session without resetting question progress
export function quiz(
  store: Store,
  revision?: number,
  catalogue: Lesson[] = lessons,
): QuizSession {
  store.db.exec('BEGIN IMMEDIATE');
  try {
    const row = store.db
      .prepare('SELECT state FROM quiz_session WHERE id=1')
      .get();
    const old = row
      ? (JSON.parse(String(row.state)) as QuizSession)
      : undefined;

    // Return the persisted selection on ordinary reads, with no date-based replacement
    if (revision === undefined && old) {
      store.db.exec('COMMIT');
      return old;
    }
    if (revision !== undefined && revision !== (old?.revision ?? 0))
      throw new DomainError(
        'Daily Quiz changed in another tab — reload before refreshing',
        409,
      );

    // Pause a running model only during explicit refresh, retaining its elapsed time and history
    if (revision !== undefined) {
      const row = store.db
        .prepare('SELECT state FROM lab_state WHERE id=1')
        .get();
      if (row) {
        const state = JSON.parse(String(row.state));
        if (state.running) {
          state.elapsed = Math.min(
            1800,
            state.elapsed + Math.max(0, (Date.now() - state.updated) / 1000),
          );
          state.running = false;
          state.updated = Date.now();
          state.revision++;
          state.history.push({
            at: Math.floor(state.elapsed),
            action: 'pause',
            output: 'Paused by explicit Daily Quiz refresh',
          });
          store.db
            .prepare('UPDATE lab_state SET state=? WHERE id=1')
            .run(JSON.stringify(state));
        }
      }
    }
    if (old)
      store.db
        .prepare('INSERT INTO quiz_history VALUES (?,?)')
        .run(old.id, JSON.stringify(old));
    const next: QuizSession = {
      id: randomUUID(),
      revision: (old?.revision ?? 0) + 1,
      createdAt: new Date().toISOString(),
      items: selectQuiz(store, old?.items, catalogue),
    };
    store.db
      .prepare(
        'INSERT INTO quiz_session VALUES (1,?) ON CONFLICT(id) DO UPDATE SET state=excluded.state',
      )
      .run(JSON.stringify(next));
    store.db.exec('COMMIT');
    return next;
  } catch (error) {
    store.db.exec('ROLLBACK');
    throw error;
  }
}
