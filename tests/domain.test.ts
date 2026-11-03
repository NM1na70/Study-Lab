// Import the real lesson pack, assessment rules, and validation contract for domain scenarios
import { describe, it, expect } from 'vitest';
import { lessons } from '../src/shared/lessons.js';
import {
  emptyProgress,
  mark,
  mutate,
  satisfied,
} from '../src/shared/domain.js';
import { mutationSchema } from '../src/shared/schema.js';

// Use the real lesson pack so assessment tests exercise its declared answer-normalisation policies
const lesson = lessons[0];

// Exercise precise marking, assistance records, completion, and conflicts without a database
describe('assessment and completion', () => {
  it('normalises case/outer space but rejects spelling errors and unassessed writing', () => {
    expect(mark(lesson.tasks[0], ' ACTION ')).toBe(true);
    expect(mark(lesson.tasks[0], 'acttion')).toBe(false);
    expect(
      mark(
        lesson.tasks.find((t) => t.kind === 'written')!,
        'anything',
      ),
    ).toBe(false);
    const path = lessons[1].tasks.find((t) => t.id === 'request-path')!;
    expect(mark(path, '/CHECKIN?host=lab-01')).toBe(false);
  });

  // Keep the original wrong attempt and recorded assistance after a later successful retry
  it('tracks attempts, mistakes, hints and explicit solution use', () => {
    let p = emptyProgress(lesson);
    for (const m of [
      { action: 'draft' as const, answer: 'wrong' },
      { action: 'check' as const },
      { action: 'hint' as const },
      { action: 'solution' as const },
      { action: 'draft' as const, answer: 'action' },
      { action: 'check' as const },
    ])
      p = mutate(lesson, p, { ...m, taskId: 'action', revision: p.revision });
    expect(p.tasks.action.attemptLog?.map((attempt) => attempt.answer)).toEqual(
      ['wrong', 'action'],
    );
    expect(p.tasks.action).toMatchObject({
      attempts: 2,
      mistakes: 1,
      hints: 1,
      solution: true,
      correct: true,
    });
  });

  // Complete the actual required activities and show that editing assessed work reopens completion
  it('requires all precise answers and self-review; editing reopens completion', () => {
    let p = emptyProgress(lesson);
    expect(() =>
      mutate(lesson, p, { action: 'complete', revision: 0 }),
    ).toThrow(/Correct all/);
    for (const task of lesson.tasks) {
      p = mutate(lesson, p, {
        action: 'draft',
        taskId: task.id,
        answer: task.example,
        revision: p.revision,
      });
      p = mutate(lesson, p, {
        action: task.kind === 'written' ? 'selfReview' : 'check',
        taskId: task.id,
        revision: p.revision,
      });
    }
    expect(satisfied(lesson, p)).toBe(lesson.tasks.length);
    p = mutate(lesson, p, { action: 'complete', revision: p.revision });
    expect(p.completedAt).toBeTruthy();
    p = mutate(lesson, p, {
      action: 'draft',
      taskId: 'action',
      answer: 'changed',
      revision: p.revision,
    });
    expect(p.completedAt).toBeNull();
    expect(p.tasks.action.correct).toBe(false);
  });

  // Reject invalid task references and stale work instead of changing the learner snapshot
  it('rejects unknown tasks, steps, stale revisions, changed content and malformed input', () => {
    const p = emptyProgress(lesson);
    expect(() =>
      mutate(lesson, p, { action: 'check', taskId: 'missing', revision: 0 }),
    ).toThrow('Unknown');
    expect(() =>
      mutate(lesson, p, { action: 'step', step: 99, revision: 0 }),
    ).toThrow('Invalid');
    expect(() =>
      mutate(lesson, p, { action: 'hint', taskId: 'action', revision: 8 }),
    ).toThrow('another window');
    expect(() =>
      mutate({ ...lesson, version: 2 }, p, {
        action: 'step',
        step: 0,
        revision: 0,
      }),
    ).toThrow('Content changed');
    expect(
      mutationSchema.safeParse({ action: 'draft', revision: -1 }).success,
    ).toBe(false);
    expect(
      mutationSchema.safeParse({
        action: 'draft',
        revision: 0,
        answer: 'a'.repeat(10001),
      }).success,
    ).toBe(false);
  });
});
