// Import controlled-time scheduling and a disposable in-memory learner store
import { it, expect } from 'vitest';
import { Store } from '../src/server/store.js';
import { lessons } from '../src/shared/lessons.js';
import { nextSchedule, type Schedule } from '../src/shared/review.js';

it('uses deterministic UTC intervals across midnight without penalising overdue items', () => {
  const schedule: Schedule = {
    concept: 'word',
    lessonId: 'test',
    taskId: 'test',
    contentVersion: 1,
    level: 0,
    dueAt: '2026-01-01T00:00:00.000Z',
    dismissed: false,
  };
  const now = new Date('2026-02-01T23:59:00.000Z');
  expect(nextSchedule(schedule, true, false, now).dueAt).toBe(
    '2026-02-04T23:59:00.000Z',
  );
  expect(nextSchedule(schedule, false, false, now).dueAt).toBe(
    '2026-02-02T00:09:00.000Z',
  );
  expect(nextSchedule(schedule, true, true, now).dueAt).toBe(
    '2026-02-02T00:59:00.000Z',
  );
});

it('records review separately, deduplicates results and persists dismissal until a new lesson mistake', () => {
  let now = new Date('2026-11-05T23:55:00.000Z');
  const store = new Store(':memory:', () => now);
  const lesson = lessons[0];
  try {
    let progress = store.get(lesson);
    for (const mutation of [
      { action: 'draft' as const, taskId: 'action', answer: 'wrong' },
      { action: 'check' as const, taskId: 'action' },
    ])
      progress = store.update(lesson, {
        ...mutation,
        revision: progress.revision,
      });
    expect(store.reviews.snapshot().count).toBe(1);
    const original = store.get(lesson);
    let session = store.reviews.start('English');
    expect(store.reviews.start('English').id).toBe(session.id);
    session = store.reviews.update(session.id, {
      action: 'draft',
      answer: 'action',
      revision: session.revision,
    });
    const oldRevision = session.revision;
    session = store.reviews.update(session.id, {
      action: 'check',
      revision: session.revision,
    });
    expect(session.items[0].nextDue).toBe('2026-11-08T23:55:00.000Z');
    expect(() =>
      store.reviews.update(session.id, {
        action: 'check',
        revision: oldRevision,
      }),
    ).toThrow(/changed/);
    expect(store.get(lesson)).toEqual(original);
    progress = store.update(lesson, {
      action: 'dismissReview',
      taskId: 'action',
      revision: progress.revision,
    });
    now = new Date('2027-01-01T00:00:00Z');
    store.reviews.seed(lesson, store.get(lesson));
    expect(store.reviews.snapshot().count).toBe(0);
    progress = store.update(lesson, {
      action: 'restoreReview',
      taskId: 'action',
      revision: progress.revision,
    });
    expect(store.reviews.snapshot().count).toBe(1);
    progress = store.update(lesson, {
      action: 'dismissReview',
      taskId: 'action',
      revision: progress.revision,
    });
    store.update(lesson, {
      action: 'check',
      taskId: 'action',
      revision: progress.revision,
    });
    expect(store.reviews.snapshot().count).toBe(1);
  } finally {
    store.close();
  }
});

it('does not turn recently revealed answers into independent recall by starting another session', () => {
  const store = new Store(
    ':memory:',
    () => new Date('2026-11-05T10:00:00.000Z'),
  );
  const lesson = lessons[0];
  try {
    let p = store.get(lesson);
    for (const mutation of [
      { action: 'draft' as const, answer: 'wrong' },
      { action: 'check' as const },
      { action: 'solution' as const },
    ])
      p = store.update(lesson, {
        ...mutation,
        taskId: 'action',
        revision: p.revision,
      });
    let session = store.reviews.start('English');
    expect(session.items[0].assisted).toBe(true);
    session = store.reviews.update(session.id, {
      action: 'draft',
      answer: 'action',
      revision: session.revision,
    });
    session = store.reviews.update(session.id, {
      action: 'check',
      revision: session.revision,
    });
    expect(session.items[0].nextDue).toBe('2026-11-05T11:00:00.000Z');
  } finally {
    store.close();
  }
});

it('removes due items persistently and undoes their exact schedule without erasing lesson history', () => {
  const store = new Store(':memory:');
  const lesson = lessons[0];
  try {
    let p = store.get(lesson);
    for (const mutation of [
      { action: 'draft' as const, answer: 'wrong' },
      { action: 'check' as const },
    ])
      p = store.update(lesson, {
        ...mutation,
        taskId: 'action',
        revision: p.revision,
      });
    const original = store.get(lesson).tasks.action;
    const before = store.reviews.snapshot().due[0];
    let session = store.reviews.start('English');
    session = store.reviews.update(session.id, {
      action: 'dismiss',
      revision: session.revision,
    });
    expect(store.reviews.snapshot().count).toBe(0);
    expect(store.get(lesson).tasks.action).toEqual({
      ...original,
      reviewDismissedMistakes: 1,
    });
    session = store.reviews.update(session.id, {
      action: 'undo',
      revision: session.revision,
    });
    expect(store.reviews.snapshot().due[0]).toEqual(before);
    expect(store.get(lesson).tasks.action.attempts).toBe(1);
    expect(session.index).toBe(0);
  } finally {
    store.close();
  }
});

it('seeds independently learned concepts and skips without claiming recall or moving their due time', () => {
  let now = new Date('2026-11-05T10:00:00.000Z');
  const store = new Store(':memory:', () => now);
  const lesson = lessons[0];
  try {
    let p = store.get(lesson);
    for (const mutation of [
      { action: 'draft' as const, answer: 'action' },
      { action: 'check' as const },
    ])
      p = store.update(lesson, {
        ...mutation,
        taskId: 'action',
        revision: p.revision,
      });
    expect(store.reviews.snapshot().count).toBe(0);
    now = new Date('2026-11-06T10:00:00.000Z');
    const due = store.reviews.snapshot().due[0];
    let session = store.reviews.start('English');
    session = store.reviews.update(session.id, {
      action: 'skip',
      revision: session.revision,
    });
    expect(session.items[0].skipped).toBe(true);
    expect(session.items[0].recorded).toBe(false);
    expect(store.reviews.snapshot().due[0]).toEqual(due);
    expect(store.get(lesson).tasks.action.attempts).toBe(1);
    expect(
      store.db.prepare('SELECT count(*) AS n FROM review_results').get()?.n,
    ).toBe(0);
  } finally {
    store.close();
  }
});
