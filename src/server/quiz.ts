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
  policy?: 'course-7';
}

// Select seven distinct incomplete task units per course, aiming for a 2/3/2 difficulty mix and honest durations
export function selectQuiz(
  store: Store,
  previous: QuizItem[] = [],
  catalogue: Lesson[] = lessons,
): QuizItem[] {
  const counts = new Map<string, number>();
  const key = (item: QuizItem) => item.lessonId + ':' + item.taskId;
  for (const row of store.db.prepare('SELECT state FROM quiz_history').all())
    for (const item of (JSON.parse(String(row.state)) as QuizSession).items)
      counts.set(key(item), (counts.get(key(item)) ?? 0) + 1);
  const previousKeys = new Set(previous.map(key));
  const ranks = ['Easy', 'Medium', 'Hard'];
  const targets = [2, 3, 2];

  // Each catalogue task is one selection unit, including all fields of a reading activity or model lab
  return ['English', 'Cybersecurity'].flatMap((course) => {
    const pool = catalogue
      .filter((lesson) => lesson.course === course)
      .flatMap((lesson) => {
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
    const chosen: QuizItem[] = [];

    // Prefer less frequently selected work, using real minutes only to guide ties rather than dropping question units
    const order = (a: QuizItem, b: QuizItem) => {
      const minutesLeft =
        60 - chosen.reduce((sum, item) => sum + item.minutes, 0);
      const desired = minutesLeft / Math.max(1, 7 - chosen.length);
      return (
        (counts.get(key(a)) ?? 0) - (counts.get(key(b)) ?? 0) ||
        Math.abs(a.minutes - desired) - Math.abs(b.minutes - desired)
      );
    };

    // Exhaust alternatives before reusing unfinished questions, even when the ideal difficulty mix is scarce
    for (const candidates of [
      pool.filter((item) => !previousKeys.has(key(item))),
      pool.filter((item) => previousKeys.has(key(item))),
    ]) {
      for (const [rank, difficulty] of ranks.entries()) {
        const missing =
          targets[rank] -
          chosen.filter((item) => item.difficulty === difficulty).length;
        chosen.push(
          ...candidates
            .filter((item) => item.difficulty === difficulty)
            .sort(order)
            .slice(0, Math.max(0, Math.min(missing, 7 - chosen.length))),
        );
      }

      // Fill shortages with the nearest available difficulty in this course; never borrow completed work or another course
      while (chosen.length < 7) {
        const missing = ranks.findIndex(
          (difficulty, rank) =>
            chosen.filter((item) => item.difficulty === difficulty).length <
            targets[rank],
        );
        const next = candidates
          .filter((item) => !chosen.includes(item))
          .sort(
            (a, b) =>
              Math.abs(ranks.indexOf(a.difficulty) - missing) -
                Math.abs(ranks.indexOf(b.difficulty) - missing) || order(a, b),
          )[0];
        if (!next) break;
        chosen.push(next);
      }
    }
    return chosen;
  });
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
      policy: 'course-7',
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
