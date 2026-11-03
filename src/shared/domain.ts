// Import the lesson and progress contracts used by deterministic assessment
import type {
  Lesson,
  Mutation,
  Progress,
  Task,
  TaskProgress,
} from './schema.js';

// Attach the HTTP status used for expected validation and progress conflicts
export class DomainError extends Error {
  constructor(
    message: string,
    public statusCode = 400,
  ) {
    super(message);
  }
}

// Create new lesson and activity state without claiming attempts, assistance, or completion
export function emptyProgress(lesson: Lesson): Progress {
  return {
    lessonId: lesson.id,
    contentVersion: lesson.version,
    revision: 0,
    step: 0,
    tasks: {},
    completedAt: null,
    updatedAt: null,
  };
}
export function emptyTask(): TaskProgress {
  return {
    answer: '',
    attemptLog: [],
    attempts: 0,
    correct: false,
    hints: 0,
    solution: false,
    reviewed: false,
    mistakes: 0,
  };
}

// Mark only precise tasks using the normalisation declared by their content
export function mark(task: Task, answer: string): boolean {
  // Collapse case and whitespace only when allowed and never accept fuzzy spelling matches
  const normalise = (s: string) =>
    task.normalise === 'case-space'
      ? s.trim().toLocaleLowerCase('en-AU').replace(/\s+/g, ' ')
      : s.trim();
  return (
    task.kind === 'exact' &&
    task.answers.some((a) => normalise(a) === normalise(answer))
  );
}

// Count precise answers and explicit writing self-reviews using their different completion rules
export function satisfied(lesson: Lesson, progress: Progress): number {
  return lesson.tasks.filter((t) =>
    t.kind === 'written'
      ? progress.tasks[t.id]?.reviewed
      : progress.tasks[t.id]?.correct,
  ).length;
}

// Apply one validated action to a copy after checking content and progress revisions
export function mutate(
  lesson: Lesson,
  previous: Progress,
  mutation: Mutation,
): Progress {
  if (previous.contentVersion !== lesson.version)
    throw new DomainError(
      'Content changed. Your old work is preserved. A migration is needed before editing.',
      409,
    );
  if (mutation.revision !== previous.revision)
    throw new DomainError(
      'Progress changed in another window. Reload before editing; your unsaved text is still here.',
      409,
    );

  // Preserve the input snapshot while updating position, completion, or one task
  const next = structuredClone(previous);
  if (mutation.action === 'step') {
    if (mutation.step === undefined || mutation.step > lesson.tasks.length)
      throw new DomainError('Invalid lesson step.');
    next.step = mutation.step;
  } else if (mutation.action === 'complete') {
    if (satisfied(lesson, next) !== lesson.tasks.length)
      throw new DomainError(
        'Correct all precise answers and self-review the written activity first.',
      );
    next.completedAt ??= new Date().toISOString();
  } else {
    const task = lesson.tasks.find((t) => t.id === mutation.taskId);
    if (!task) throw new DomainError('Unknown activity.');
    const state = (next.tasks[task.id] ??= emptyTask());
    switch (mutation.action) {
      case 'draft':
        if (mutation.answer === undefined)
          throw new DomainError('Answer is required.');
        if (state.answer !== mutation.answer) {
          state.answer = mutation.answer;
          state.correct = false;
          state.reviewed = false;

          // Reopen completion because the edited answer no longer has its previous assessment
          next.completedAt = null;
        }
        break;

      // Record checked precise answers and keep wrong attempts available for later review
      case 'check':
        if (task.kind !== 'exact' || !state.answer.trim())
          throw new DomainError(
            'Enter an answer for a precise activity first.',
          );
        state.attempts++;
        state.correct = mark(task, state.answer);
        (state.attemptLog ??= []).push({
          answer: state.answer,
          correct: state.correct,
          checkedAt: new Date().toISOString(),
        });
        if (!state.correct) state.mistakes++;
        break;

      // Record assistance separately from correctness and writing self-review
      case 'hint':
        state.hints = Math.min(task.hints.length, state.hints + 1);
        break;
      case 'solution':
        state.solution = true;
        break;

      // Require a written response before recording the learner's own review rather than a grade
      case 'selfReview':
        if (task.kind !== 'written' || state.answer.trim().length < 20)
          throw new DomainError('Write your response before reviewing it.');
        state.reviewed = true;
        break;
    }
  }

  // Give every successful mutation a new revision and confirmed update timestamp
  next.revision++;
  next.updatedAt = new Date().toISOString();
  return next;
}
