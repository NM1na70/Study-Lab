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

// Preserve the requested mix and real metadata even when seven complete task units take longer than an hour
it('selects seven per course with a 2/3/2 mix and unmodified metadata durations', () => {
  const store = new Store(':memory:');
  try {
    const first = quiz(store);
    expect(first.policy).toBe('course-7');
    expect(first.items).toHaveLength(14);
    for (const course of ['English', 'Cybersecurity']) {
      const items = first.items.filter(
        (item) =>
          lessons.find((lesson) => lesson.id === item.lessonId)?.course ===
          course,
      );
      expect(items).toHaveLength(7);
      expect(
        ['Easy', 'Medium', 'Hard'].map(
          (difficulty) =>
            items.filter((item) => item.difficulty === difficulty).length,
        ),
      ).toEqual([2, 3, 2]);
      for (const item of items) {
        const task = lessons
          .find((lesson) => lesson.id === item.lessonId)!
          .tasks.find((task) => task.id === item.taskId)!;
        expect(item.minutes).toBe(task.quiz!.minutes);
      }
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
  } finally {
    store.close();
  }
});

// Count a self-contained reading or model question once rather than separately counting its fields and commands
it('keeps multi-step reading and lab durations attached to their single stable task reference', () => {
  const store = new Store(':memory:');
  try {
    const catalogue = lessons.map((lesson) => ({
      ...lesson,
      tasks: lesson.tasks.filter((task) => task.passage || task.labScenario),
    }));
    const selected = selectQuiz(store, [], catalogue);
    expect(selected).toHaveLength(
      catalogue.flatMap((lesson) => lesson.tasks).length,
    );
    for (const item of selected)
      expect(item.minutes).toBe(
        catalogue
          .find((lesson) => lesson.id === item.lessonId)!
          .tasks.find((task) => task.id === item.taskId)!.quiz!.minutes,
      );
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
      const catalogue = [{ ...source, tasks: source.tasks }];
      const pool = selectQuiz(store, [], catalogue);
      const previous = catalogue[0].tasks.slice(0, 8 - count).map((task) => ({
        lessonId: source.id,
        taskId: task.id,
        version: source.version,
        minutes: 3,
        difficulty: 'Easy',
      }));
      const next = selectQuiz(store, previous, catalogue);
      const alternatives = catalogue[0].tasks.slice(8 - count);
      expect(
        alternatives.every((task) =>
          next.some((item) => item.taskId === task.id),
        ),
      ).toBe(true);
      expect(
        next.filter((item) =>
          previous.some((old) => old.taskId === item.taskId),
        ).length,
      ).toBeLessThanOrEqual(Math.max(0, 7 - count));
      expect(pool.length).toBeGreaterThan(0);
    } finally {
      store.close();
    }
  },
);

// Fill only the same course's incomplete pool when preferred difficulty slots are unavailable
it('uses nearby difficulties and fewer-than-seven pools without borrowing from another course', () => {
  const store = new Store(':memory:');
  try {
    const source = lessons[0];
    const catalogue = [
      {
        ...source,
        tasks: source.tasks.slice(0, 6).map((task) => ({
          ...task,
          quiz: { ...task.quiz!, difficulty: 'Medium' as const },
        })),
      },
      { ...lessons[1], tasks: [] },
    ];
    const selected = selectQuiz(store, [], catalogue);
    expect(selected).toHaveLength(6);
    expect(
      selected.every(
        (item) => item.lessonId === source.id && item.difficulty === 'Medium',
      ),
    ).toBe(true);
    expect(new Set(selected.map((item) => item.taskId)).size).toBe(6);
  } finally {
    store.close();
  }
});

// Ordinary reads must return a stored mixed session exactly as saved; only explicit Refresh adopts the new policy
it('retains legacy mixed sessions and saved answers until an explicit refresh', () => {
  const store = new Store(':memory:');
  try {
    const candidates = selectQuiz(store);
    const legacy = {
      id: 'legacy-selection',
      revision: 4,
      createdAt: '2026-11-01T00:00:00Z',
      items: [...candidates.slice(0, 3), ...candidates.slice(7, 9)],
    };
    store.db
      .prepare('INSERT INTO quiz_session VALUES (1,?)')
      .run(JSON.stringify(legacy));
    const original = store.get(lessons[0]);
    const saved = store.update(lessons[0], {
      action: 'draft',
      taskId: 'action',
      answer: 'unfinished work',
      revision: original.revision,
    });
    expect(quiz(store)).toEqual(legacy);
    const refreshed = quiz(store, legacy.revision);
    expect(refreshed.policy).toBe('course-7');
    expect(refreshed.items).toHaveLength(14);
    const persisted = { ...saved };
    delete persisted.reviewDueCount;
    expect(store.get(lessons[0])).toEqual(persisted);
    expect(
      JSON.parse(
        String(
          store.db
            .prepare('SELECT state FROM quiz_history WHERE id=?')
            .get(legacy.id)?.state,
        ),
      ),
    ).toEqual(legacy);
  } finally {
    store.close();
  }
});

// A completed course contributes no filler while the other course keeps its own incomplete selection
it('returns no questions for satisfied courses and no global filler when both are finished', () => {
  const store = new Store(':memory:');
  try {
    const catalogue = [
      lessons[0],
      lessons.find((lesson) => lesson.course === 'Cybersecurity')!,
    ].map((lesson) => ({
      ...lesson,
      tasks: [lesson.tasks.find((task) => task.kind === 'exact')!],
    }));
    for (const [index, lesson] of catalogue.entries()) {
      const task = lesson.tasks[0];
      let progress = store.get(lesson);
      progress = store.update(lesson, {
        action: 'draft',
        taskId: task.id,
        answer: exampleAnswer(task),
        revision: progress.revision,
      });
      store.update(lesson, {
        action: 'check',
        taskId: task.id,
        revision: progress.revision,
      });
      const selected = selectQuiz(store, [], catalogue);
      expect(selected).toHaveLength(index === 0 ? 1 : 0);
      expect(selected.every((item) => item.lessonId !== catalogue[0].id)).toBe(
        true,
      );
    }
  } finally {
    store.close();
  }
});

// A scarce difficulty mix must still fill seven real questions when that course has enough incomplete work
it('fills seven with same-course fallback without altering task durations', () => {
  const store = new Store(':memory:');
  try {
    const source = lessons[0];
    const catalogue = [
      {
        ...source,
        tasks: source.tasks.map((task) => ({
          ...task,
          quiz: { ...task.quiz!, difficulty: 'Medium' as const },
        })),
      },
    ];
    const selected = selectQuiz(store, [], catalogue);
    expect(selected).toHaveLength(7);
    expect(new Set(selected.map((item) => item.taskId)).size).toBe(7);
    expect(
      selected.every(
        (item) => item.lessonId === source.id && item.difficulty === 'Medium',
      ),
    ).toBe(true);
  } finally {
    store.close();
  }
});
