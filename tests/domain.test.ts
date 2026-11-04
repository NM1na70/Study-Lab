// Import the real lesson pack, assessment rules, and validation contract for domain scenarios
import { describe, it, expect } from 'vitest';
import { lessons } from '../src/shared/lessons.js';
import {
  exampleAnswer,
  activeReview,
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
    ).toThrow(/remaining activities/);
    for (const task of lesson.tasks) {
      p = mutate(lesson, p, {
        action: 'draft',
        taskId: task.id,
        answer: exampleAnswer(task),
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
      mutate({ ...lesson, version: 4 }, p, {
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

// Check each answer structure without granting automatic technical credit for reasoning
it('grades options, selection sets and factual reports with explicit reasoning self-review', () => {
  const cyber = lessons[1];
  const choice = cyber.tasks.find((task) => task.kind === 'choice')!;
  expect(mark(choice, 'no')).toBe(true);
  expect(mark(choice, 'yes')).toBe(false);
  expect(mark(choice, 'No')).toBe(false);
  const select = lesson.tasks.find((task) => task.kind === 'select')!;
  expect(mark(select, 'detection')).toBe(true);
  expect(mark(select, 'connection')).toBe(false);
  const multiple = cyber.tasks.find((task) => task.kind === 'multiple')!;
  expect(mark(multiple, ['frame-8', 'frame-4', 'frame-6'])).toBe(true);
  expect(mark(multiple, ['frame-4', 'frame-6'])).toBe(false);
  expect(mark(multiple, ['frame-4', 'frame-6', 'frame-8', 'frame-5'])).toBe(
    false,
  );
  expect(mark(multiple, ['frame-4', 'frame-4', 'frame-8'])).toBe(false);
  const report = cyber.tasks.find((task) => task.kind === 'report')!;
  const answer = exampleAnswer(report) as Record<string, string>;
  expect(mark(report, answer)).toBe(true);
  expect(mark(report, { ...answer, uri: 'GET /checkin?host=lab-01' })).toBe(
    false,
  );
  let p = emptyProgress(cyber);
  p = mutate(cyber, p, {
    action: 'draft',
    taskId: report.id,
    answer,
    revision: p.revision,
  });
  expect(() =>
    mutate(cyber, p, {
      action: 'selfReview',
      taskId: report.id,
      revision: p.revision,
    }),
  ).toThrow(/factual/);
  p = mutate(cyber, p, {
    action: 'check',
    taskId: report.id,
    revision: p.revision,
  });
  expect(satisfied(cyber, p)).toBe(0);
  p = mutate(cyber, p, {
    action: 'selfReview',
    taskId: report.id,
    revision: p.revision,
  });
  expect(satisfied(cyber, p)).toBe(1);
  p = mutate(cyber, p, {
    action: 'draft',
    taskId: report.id,
    answer: { ...answer, 'assessment-reason': '' },
    revision: p.revision,
  });
  p = mutate(cyber, p, {
    action: 'check',
    taskId: report.id,
    revision: p.revision,
  });
  expect(() =>
    mutate(cyber, p, {
      action: 'selfReview',
      taskId: report.id,
      revision: p.revision,
    }),
  ).toThrow(/reasoning/);
  expect(() =>
    mutate(cyber, p, {
      action: 'draft',
      taskId: report.id,
      answer: { ...answer, unknownfield: 'value' },
      revision: p.revision,
    }),
  ).toThrow(/shape/);
});

// Dismissal never changes assessment history and only a new wrong check reactivates the item
it('preserves removed history and reactivates after a new wrong attempt', () => {
  let p = emptyProgress(lesson);
  for (const mutation of [
    { action: 'draft' as const, answer: 'wrong' },
    { action: 'check' as const },
  ])
    p = mutate(lesson, p, {
      ...mutation,
      taskId: 'action',
      revision: p.revision,
    });
  const before = structuredClone(p.tasks.action);
  p = mutate(lesson, p, {
    action: 'dismissReview',
    taskId: 'action',
    revision: p.revision,
  });
  expect(activeReview(lesson.tasks[0], p.tasks.action)).toBe(false);
  expect(p.tasks.action).toEqual({ ...before, reviewDismissedMistakes: 1 });
  p = mutate(lesson, p, {
    action: 'restoreReview',
    taskId: 'action',
    revision: p.revision,
  });
  expect(activeReview(lesson.tasks[0], p.tasks.action)).toBe(true);
  p = mutate(lesson, p, {
    action: 'dismissReview',
    taskId: 'action',
    revision: p.revision,
  });
  p = mutate(lesson, p, {
    action: 'check',
    taskId: 'action',
    revision: p.revision,
  });
  expect(activeReview(lesson.tasks[0], p.tasks.action)).toBe(true);
  expect(p.tasks.action.attempts).toBe(2);
});

// Require scenario-specific evidence rather than accepting any existing frame as support
it('checks assessment-to-evidence relationships and keeps reasoning self-review separate', () => {
  const report = lessons[1].tasks.find((task) => task.kind === 'report')!;
  const answer = exampleAnswer(
    report,
  ) as import('../src/shared/schema.js').ReportAnswer;
  expect(
    mark(report, {
      ...answer,
      assessment: 'automated-polling',
      evidence: 'capture-only',
    }),
  ).toBe(false);
  expect(
    mark(report, {
      ...answer,
      assessment: 'inconclusive',
      evidence: 'capture-only',
    }),
  ).toBe(true);
  expect(mark(report, { ...answer, assessment: 'benign-possible' })).toBe(true);
  expect(mark(report, { ...answer, assessment: 'suspicious-possible' })).toBe(
    true,
  );
  expect(
    mark(report, { ...answer, frames: ['frame-4', 'frame-5', 'frame-8'] }),
  ).toBe(false);
  expect(mark(report, { ...answer, 'assessment-reason': '' })).toBe(true);
  let progress = emptyProgress(lessons[1]);
  for (const mutation of [
    {
      action: 'draft' as const,
      answer: { ...answer, 'assessment-reason': '' },
    },
    { action: 'check' as const },
  ])
    progress = mutate(lessons[1], progress, {
      ...mutation,
      taskId: report.id,
      revision: progress.revision,
    });
  expect(() =>
    mutate(lessons[1], progress, {
      action: 'selfReview',
      taskId: report.id,
      revision: progress.revision,
    }),
  ).toThrow(/reasoning/);
});

// Copy the actual saved answer and its current check status without granting report assessment
it('copies incorrect findings with provenance and invalidates checks after an edit', async () => {
  const { findingStatus, assisted } = await import('../src/shared/domain.js');
  const lesson = lessons[1];
  let progress = emptyProgress(lesson);
  for (const mutation of [
    { action: 'draft' as const, taskId: 'source-host', answer: '192.0.2.99' },
    { action: 'check' as const, taskId: 'source-host' },
    { action: 'draft' as const, taskId: 'incident-note', answer: {} },
  ])
    progress = mutate(lesson, progress, {
      ...mutation,
      revision: progress.revision,
    });
  expect(findingStatus(progress.tasks['source-host'])).toBe(
    'Checked — Incorrect',
  );
  progress = mutate(lesson, progress, {
    action: 'useFinding',
    taskId: 'incident-note',
    sourceTaskId: 'source-host',
    revision: progress.revision,
  });
  expect(progress.tasks['incident-note'].answer).toEqual({
    source: '192.0.2.99',
  });
  expect(progress.tasks['incident-note']).toMatchObject({
    correct: false,
    reviewed: false,
    attempts: 0,
    findingProvenance: {
      source: { sourceTaskId: 'source-host', status: 'Checked — Incorrect' },
    },
  });
  expect(assisted(progress)).toBe(false);
  progress = mutate(lesson, progress, {
    action: 'draft',
    taskId: 'source-host',
    answer: '192.0.2.10',
    revision: progress.revision,
  });
  progress = mutate(lesson, progress, {
    action: 'draft',
    taskId: 'source-host',
    answer: '192.0.2.99',
    revision: progress.revision,
  });
  expect(findingStatus(progress.tasks['source-host'])).toBe('Not Checked');
  progress = mutate(lesson, progress, {
    action: 'hint',
    taskId: 'source-host',
    revision: progress.revision,
  });
  expect(assisted(progress)).toBe(true);
});
