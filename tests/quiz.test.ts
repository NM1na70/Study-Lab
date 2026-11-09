// Verify selection references and refresh transactions without touching learner data
import { it, expect } from 'vitest';
import { Store } from '../src/server/store.js';
import { quiz, selectQuiz } from '../src/server/quiz.js';
import { lessons } from '../src/shared/lessons.js';
import { exampleAnswer, taskSatisfied } from '../src/shared/domain.js';
it('persists the same selection until explicit refresh and rejects stale refreshes', () => {
  const store = new Store(':memory:');
  try {
    const first = quiz(store);
    expect(quiz(store)).toEqual(first);
    expect(
      new Set(first.items.map((item) => item.lessonId + item.taskId)).size,
    ).toBe(first.items.length);
    expect(
      new Set(
        first.items.map(
          (item) =>
            lessons.find((lesson) => lesson.id === item.lessonId)?.course,
        ),
      ).size,
    ).toBe(2);
    const next = quiz(store, first.revision);
    expect(next.id).not.toBe(first.id);
    expect(() => quiz(store, first.revision)).toThrow(/another tab/);
    expect(
      store.db.prepare('SELECT count(*) AS n FROM quiz_history').get()?.n,
    ).toBe(1);
  } finally {
    store.close();
  }
});
it('uses the same lesson answers and excludes satisfied questions without completing their lesson', () => {
  const store = new Store(':memory:');
  try {
    const item = quiz(store).items[0];
    const lesson = lessons.find((lesson) => lesson.id === item.lessonId)!;
    const task = lesson.tasks.find((task) => task.id === item.taskId)!;
    let progress = store.get(lesson);
    progress = store.update(lesson, {
      action: 'draft',
      taskId: task.id,
      answer: exampleAnswer(task),
      revision: progress.revision,
    });
    progress = store.update(lesson, {
      action: 'check',
      taskId: task.id,
      revision: progress.revision,
    });
    expect(taskSatisfied(task, progress.tasks[task.id])).toBe(true);
    expect(progress.completedAt).toBeNull();
    expect(
      selectQuiz(store).some(
        (candidate) =>
          candidate.lessonId === item.lessonId &&
          candidate.taskId === item.taskId,
      ),
    ).toBe(false);
  } finally {
    store.close();
  }
});

it('uses catalogue metadata for balanced near-90-minute groups and keeps Medium work reachable', () => {
  const store = new Store(':memory:');
  try {
    const first = quiz(store);
    const minutes = first.items.reduce(
      (total, item) => total + item.minutes,
      0,
    );
    expect(minutes).toBeGreaterThanOrEqual(65);
    expect(minutes).toBeLessThanOrEqual(115);
    for (const course of ['English', 'Cybersecurity']) {
      const items = first.items.filter(
        (item) =>
          lessons.find((lesson) => lesson.id === item.lessonId)?.course ===
          course,
      );
      expect(items.filter((item) => item.difficulty === 'Easy')).toHaveLength(
        2,
      );
      expect(items.filter((item) => item.difficulty === 'Hard')).toHaveLength(
        2,
      );
    }
    const second = quiz(store, first.revision);
    expect(
      second.items.every(
        (item) =>
          !first.items.some(
            (old) =>
              old.lessonId === item.lessonId && old.taskId === item.taskId,
          ),
      ),
    ).toBe(true);
    expect(second.items.some((item) => item.difficulty === 'Medium')).toBe(
      true,
    );
    expect(
      first.items.some(
        (item) =>
          lessons
            .find((lesson) => lesson.id === item.lessonId)
            ?.tasks.find((task) => task.id === item.taskId)?.passage,
      ),
    ).toBe(true);
    expect(
      first.items.some(
        (item) =>
          lessons
            .find((lesson) => lesson.id === item.lessonId)
            ?.tasks.find((task) => task.id === item.taskId)?.labScenario,
      ),
    ).toBe(true);
  } finally {
    store.close();
  }
});

it('uses a genuinely shorter small pool and permits repeats when no alternatives exist', () => {
  const store = new Store(':memory:');
  try {
    const catalogue = lessons
      .filter(
        (lesson) => lesson.id === lessons[0].id || lesson.id === lessons[1].id,
      )
      .map((lesson) => ({ ...lesson, tasks: [lesson.tasks[0]] }));
    const first = selectQuiz(store, [], catalogue);
    expect(first).toHaveLength(2);
    expect(first.reduce((sum, item) => sum + item.minutes, 0)).toBe(6);
    expect(selectQuiz(store, first, catalogue)).toEqual(first);
  } finally {
    store.close();
  }
});

it.each([1, 2, 3])(
  'uses all %s alternatives before repeating unfinished selections',
  (count) => {
    const store = new Store(':memory:');
    try {
      const source = lessons[0];
      const catalogue = [{ ...source, tasks: source.tasks.slice(0, 5) }];
      const pool = selectQuiz(store, [], catalogue);
      const previous = catalogue[0].tasks.slice(0, 5 - count).map((task) => ({
        lessonId: source.id,
        taskId: task.id,
        version: source.version,
        minutes: 3,
        difficulty: 'Easy',
      }));
      const next = selectQuiz(store, previous, catalogue);
      const alternatives = catalogue[0].tasks.slice(5 - count);
      expect(
        alternatives.every((task) =>
          next.some((item) => item.taskId === task.id),
        ),
      ).toBe(true);
      expect(
        next.filter((item) =>
          previous.some((old) => old.taskId === item.taskId),
        ).length,
      ).toBeLessThanOrEqual(Math.max(0, 4 - count));
      expect(pool.length).toBeGreaterThan(0);
    } finally {
      store.close();
    }
  },
);
