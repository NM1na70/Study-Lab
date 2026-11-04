// Preserve earlier work separately when the activity's assessment changes
import type { Lesson, Progress } from './schema.js';
import { assisted, emptyTask, isRecord } from './domain.js';

export function migrateProgress(lesson: Lesson, previous: Progress): Progress {
  if (previous.contentVersion === lesson.version) return previous;
  // Retain equivalent facts and archive the full earlier report before requiring the new evidence relationships
  if (lesson.version === 3 && [1, 2].includes(previous.contentVersion)) {
    const prior =
      previous.contentVersion === 1
        ? migrateProgress({ ...lesson, version: 2 }, previous)
        : previous;
    const next = structuredClone(prior);
    const state = next.tasks['incident-note'];
    if (next.completedAt) {
      (next.completionHistory ??= []).push({
        contentVersion: 2,
        completedAt: next.completedAt,
        assisted: assisted(prior),
      });
      next.completedAt = null;
    }
    if (state) {
      (state.previousWork ??= []).push({
        contentVersion: 2,
        answer: structuredClone(state.answer),
        correct: state.correct,
        reviewed: state.reviewed,
        hints: state.hints,
        solution: state.solution,
      });
      const old = isRecord(state.answer) ? state.answer : {};
      const answer: Record<string, string | string[]> = {};
      for (const id of [
        'source',
        'destination',
        'observed-at',
        'time-zone',
        'method',
        'uri',
        'interval',
      ])
        if (typeof old[id] === 'string') answer[id] = old[id];
      if (
        typeof old.frames === 'string' &&
        /^\d+(?:[,\s]+\d+)*$/.test(old.frames.trim())
      ) {
        const frames = old.frames
          .trim()
          .split(/[,\s]+/)
          .map((frame) => `frame-${frame}`);
        const options = lesson.tasks
          .find((task) => task.id === 'incident-note')!
          .fields.find((field) => field.id === 'frames')!.options;
        if (
          new Set(frames).size === frames.length &&
          frames.every((id) => options.some((option) => option.id === id))
        )
          answer.frames = frames;
      }
      state.answer = answer;
      state.correct = false;
      state.checked = false;
      state.reviewed = false;
      state.fieldResults = undefined;
      state.hints = 0;
      state.solution = false;
    }
    next.contentVersion = 3;
    next.revision++;
    return next;
  }
  if (previous.contentVersion !== 1 || lesson.version !== 2)
    throw new Error('Unsupported content migration');
  const next = structuredClone(previous);
  next.completionHistory ??= [];
  if (next.completedAt)
    next.completionHistory.push({
      contentVersion: 1,
      completedAt: next.completedAt,
      assisted: assisted(previous),
    });
  for (const task of lesson.tasks) {
    const saved = next.tasks[task.id];
    if (!saved) continue;
    if (task.id === 'incident-note' || task.id === 'request-count') {
      const archive = {
        contentVersion: 1,
        answer: saved.answer,
        correct: saved.correct,
        reviewed: saved.reviewed,
        hints: saved.hints,
        solution: saved.solution,
      };
      next.tasks[task.id] = {
        ...saved,
        ...emptyTask(task),
        attempts: saved.attempts,
        mistakes: saved.mistakes,
        attemptLog: saved.attemptLog,
        previousWork: [...(saved.previousWork ?? []), archive],
      };
      next.completedAt = null;
    } else if (task.kind === 'choice' || task.kind === 'select') {
      (saved.previousWork ??= []).push({
        contentVersion: 1,
        answer: saved.answer,
        correct: saved.correct,
        reviewed: saved.reviewed,
        hints: saved.hints,
        solution: saved.solution,
      });
      const answer = String(saved.answer).trim().toLowerCase();
      if (task.options.some((option) => option.id === answer))
        saved.answer = answer;
      else {
        saved.answer = '';
        saved.correct = false;
        saved.reviewed = false;
      }
    }
  }
  next.contentVersion = lesson.version;
  next.revision++;
  return next;
}
