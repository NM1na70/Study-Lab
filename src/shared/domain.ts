// Import the answer structures used by deterministic assessment and saved progress
import type {
  Answer,
  Lesson,
  Mutation,
  Progress,
  ReportField,
  ReportAnswer,
  ReportValue,
  Task,
  TaskProgress,
} from './schema.js';

// Give expected validation and revision conflicts consistent HTTP statuses
export class DomainError extends Error {
  constructor(
    message: string,
    public statusCode = 400,
  ) {
    super(message);
  }
}

// Create unsaved progress with the lesson’s current content version
export function emptyProgress(lesson: Lesson): Progress {
  return {
    lessonId: lesson.id,
    contentVersion: lesson.version,
    revision: 0,
    step: 0,
    tasks: {},
    completedAt: null,
    updatedAt: null,
    completionHistory: [],
  };
}
export function emptyTask(task?: Task): TaskProgress {
  return {
    answer: task?.kind === 'report' ? {} : task?.kind === 'multiple' ? [] : '',
    attemptLog: [],
    attempts: 0,
    correct: false,
    hints: 0,
    solution: false,
    reviewed: false,
    mistakes: 0,
  };
}

// Apply the declared text policy without fuzzy spelling or URI matching
export function normalise(
  value: string,
  policy: 'trim' | 'case-space',
): string {
  return policy === 'trim'
    ? value.trim()
    : value.trim().toLocaleLowerCase('en-AU').replace(/\s+/g, ' ');
}
export function isRecord(answer: Answer): answer is ReportAnswer {
  return typeof answer === 'object' && !Array.isArray(answer);
}

// Check input shape and known option or field IDs before accepting any saved answer
export function validateAnswer(task: Task, answer: Answer): boolean {
  if (task.kind === 'report')
    return (
      isRecord(answer) &&
      Object.keys(answer).every((id) => task.fields.some((f) => f.id === id)) &&
      task.fields.every((field) => {
        const value = answer[field.id];
        if (value === undefined) return true;
        if (field.kind === 'multiple')
          return (
            Array.isArray(value) &&
            new Set(value).size === value.length &&
            value.every((id) =>
              field.options.some((option) => option.id === id),
            )
          );
        return (
          typeof value === 'string' &&
          (field.kind !== 'select' ||
            !value ||
            field.options.some((option) => option.id === value))
        );
      })
    );
  if (task.kind === 'multiple')
    return (
      Array.isArray(answer) &&
      new Set(answer).size === answer.length &&
      answer.every((id) => task.options.some((o) => o.id === id))
    );
  if (typeof answer !== 'string') return false;
  return (
    !['choice', 'select'].includes(task.kind) ||
    answer === '' ||
    task.options.some((o) => o.id === answer)
  );
}

// Check factual report fields separately from learner reasoning
export function fieldCorrect(field: ReportField, value: ReportValue): boolean {
  if (field.kind === 'multiple')
    return (
      Array.isArray(value) &&
      value.length === field.answers.length &&
      field.answers.every((id) => value.includes(id))
    );
  return (
    typeof value === 'string' &&
    field.kind !== 'reasoning' &&
    field.answers.some(
      (a) =>
        normalise(a, field.normalise) === normalise(value, field.normalise),
    )
  );
}
export function reportResults(
  task: Task,
  answer: Answer,
): Record<string, boolean> {
  const values = isRecord(answer) ? answer : {};
  const results = Object.fromEntries(
    task.fields
      .filter((field) => field.kind !== 'reasoning')
      .map((field) => [field.id, fieldCorrect(field, values[field.id] ?? '')]),
  );

  // Assess only explicit scenario relationships, never the meaning of arbitrary learner prose
  if (task.reportRules.length) {
    const rule = task.reportRules.find(
      (rule) => rule.assessmentId === values.assessment,
    );
    const frames = values.frames;
    results.evidence =
      !!results.evidence &&
      !!rule &&
      typeof values.evidence === 'string' &&
      rule.evidenceIds.includes(values.evidence) &&
      Array.isArray(frames) &&
      rule.frameIds.every((id) => frames.includes(id));
  }
  return results;
}

// Exact text remains strict spelling, while options use IDs and multiple selections use set equality
export function mark(task: Task, answer: Answer): boolean {
  if (!validateAnswer(task, answer) || task.kind === 'written') return false;
  if (task.kind === 'report')
    return Object.values(reportResults(task, answer)).every(Boolean);
  if (task.kind === 'multiple')
    return (
      Array.isArray(answer) &&
      answer.length === task.answers.length &&
      task.answers.every((a) => answer.includes(a))
    );
  return (
    typeof answer === 'string' &&
    task.answers.some(
      (a) => normalise(a, task.normalise) === normalise(answer, task.normalise),
    )
  );
}

// Require both correct facts and explicit reasoning review for reports
export function taskSatisfied(task: Task, state?: TaskProgress): boolean {
  return (
    !!state &&
    (task.kind === 'written'
      ? state.reviewed
      : task.kind === 'report'
        ? state.correct && state.reviewed
        : state.correct)
  );
}
export function satisfied(lesson: Lesson, p: Progress): number {
  return lesson.tasks.filter((t) => taskSatisfied(t, p.tasks[t.id])).length;
}
export function remainingTasks(lesson: Lesson, p: Progress): Task[] {
  return lesson.tasks.filter((t) => !taskSatisfied(t, p.tasks[t.id]));
}

// Use the dismissal count as a watermark so only a new mistake reactivates review
export function activeReview(task: Task, state?: TaskProgress): boolean {
  return (
    task.kind !== 'written' &&
    !!state &&
    state.mistakes > (state.reviewDismissedMistakes ?? 0)
  );
}
export function assisted(p: Progress): boolean {
  return Object.values(p.tasks).some(
    (t) =>
      t.hints > 0 ||
      t.solution ||
      t.previousWork?.some((w) => w.hints > 0 || w.solution),
  );
}

// Build examples and readable history from content-defined IDs and labels
export function exampleAnswer(task: Task): Answer {
  return task.kind === 'report'
    ? Object.fromEntries(task.fields.map((f) => [f.id, f.example]))
    : task.kind === 'multiple'
      ? [...task.answers]
      : ['choice', 'select'].includes(task.kind)
        ? task.answers[0]
        : task.example;
}
export function displayField(
  field: ReportField,
  value: ReportValue | undefined,
): string {
  if (
    value === undefined ||
    value === '' ||
    (Array.isArray(value) && !value.length)
  )
    return '[Missing]';
  const label = (id: string) =>
    field.options.find((option) => option.id === id)?.label ?? id;
  return Array.isArray(value)
    ? value.map(label).join(', ')
    : field.kind === 'select'
      ? label(value)
      : value;
}
export function displayAnswer(task: Task, answer: Answer): string {
  if (Array.isArray(answer))
    return answer
      .map((id) => task.options.find((option) => option.id === id)?.label ?? id)
      .join(', ');
  if (isRecord(answer))
    return task.fields
      .map(
        (field) => `${field.label}: ${displayField(field, answer[field.id])}`,
      )
      .join('\n');
  return task.options.find((option) => option.id === answer)?.label ?? answer;
}

// A saved edit is unassessed unless the latest applicable check used exactly that answer
export function findingStatus(
  state: TaskProgress | undefined,
): 'Not Checked' | 'Checked — Incorrect' | 'Checked — Correct' {
  const last = state?.attemptLog?.at(-1);
  if (
    state?.checked === false ||
    (state?.checked === undefined && !state?.correct)
  )
    return 'Not Checked';
  if (!last || JSON.stringify(last.answer) !== JSON.stringify(state?.answer))
    return 'Not Checked';
  return last.correct ? 'Checked — Correct' : 'Checked — Incorrect';
}
export function findingValue(
  task: Task,
  sourceTaskId: string,
  source: TaskProgress | undefined,
): { fieldId: string; value: ReportValue } | undefined {
  const mapping = task.findingMappings.find(
    (mapping) => mapping.taskId === sourceTaskId,
  );
  if (!mapping || !source || isRecord(source.answer)) return;

  // Do not truncate a saved finding to make it fit a bounded report field
  if (typeof source.answer === 'string' && source.answer.length > 2000) return;
  const field = task.fields.find((field) => field.id === mapping.fieldId);
  if (!field) return;
  if (
    field.kind === 'multiple'
      ? !Array.isArray(source.answer)
      : typeof source.answer !== 'string'
  )
    return;
  if (
    Array.isArray(source.answer) ? !source.answer.length : !source.answer.trim()
  )
    return;
  return { fieldId: field.id, value: structuredClone(source.answer) };
}

// Apply one bounded action after rejecting stale work and unsupported content versions
export function mutate(
  lesson: Lesson,
  previous: Progress,
  m: Mutation,
): Progress {
  if (previous.contentVersion !== lesson.version)
    throw new DomainError(
      'Content changed — a migration is needed before editing',
      409,
    );
  if (m.revision !== previous.revision)
    throw new DomainError(
      'Progress changed in another window — copy unsaved text before reloading',
      409,
    );
  const next = structuredClone(previous);
  if (m.action === 'step') {
    if (m.step === undefined || m.step < 0 || m.step > lesson.tasks.length)
      throw new DomainError('Invalid lesson step');
    next.step = m.step;
  } else if (m.action === 'complete') {
    const missing = remainingTasks(lesson, next);
    if (missing.length)
      throw new DomainError(
        `Finish ${missing.length} remaining activities, including any factual checks and self-review`,
      );
    next.completedAt ??= new Date().toISOString();
  } else {
    const task = lesson.tasks.find((t) => t.id === m.taskId);
    if (!task) throw new DomainError('Unknown activity');
    const state = (next.tasks[task.id] ??= emptyTask(task));
    switch (m.action) {
      case 'useFinding': {
        const source = next.tasks[m.sourceTaskId ?? ''];
        const copy =
          task.kind === 'report'
            ? findingValue(task, m.sourceTaskId ?? '', source)
            : undefined;
        if (!copy || !isRecord(state.answer))
          throw new DomainError('This finding cannot be mapped to the report');
        const provenance = {
          ...(state.findingProvenance ?? {}),
          [copy.fieldId]: {
            sourceTaskId: m.sourceTaskId!,
            answer: structuredClone(source.answer),
            status: findingStatus(source),
          },
        };
        const drafted = mutate(lesson, previous, {
          action: 'draft',
          taskId: task.id,
          answer: { ...state.answer, [copy.fieldId]: copy.value },
          revision: m.revision,
        });
        drafted.tasks[task.id].findingProvenance = provenance;
        return drafted;
      }
      case 'draft':
        if (m.answer === undefined || !validateAnswer(task, m.answer))
          throw new DomainError('Answer shape or option is invalid');
        if (JSON.stringify(state.answer) !== JSON.stringify(m.answer)) {
          if (
            state.findingProvenance &&
            isRecord(state.answer) &&
            isRecord(m.answer)
          )
            for (const id of Object.keys(state.findingProvenance)) {
              if (
                JSON.stringify(state.answer[id]) !==
                JSON.stringify(m.answer[id])
              )
                delete state.findingProvenance[id];
            }
          state.answer = m.answer;
          state.correct = false;
          state.checked = false;
          state.reviewed = false;
          state.fieldResults = undefined;
          if (next.completedAt) {
            (next.completionHistory ??= []).push({
              contentVersion: next.contentVersion,
              completedAt: next.completedAt,
              assisted: assisted(next),
            });
            next.completedAt = null;
          }
        }
        break;
      case 'check':
        if (
          task.kind === 'written' ||
          !validateAnswer(task, state.answer) ||
          (typeof state.answer === 'string' && !state.answer.trim()) ||
          (Array.isArray(state.answer) && !state.answer.length)
        )
          throw new DomainError('Enter an answer before checking');
        state.attempts++;
        state.checked = true;
        state.correct = mark(task, state.answer);
        if (task.kind === 'report')
          state.fieldResults = reportResults(task, state.answer);
        (state.attemptLog ??= []).push({
          answer: structuredClone(state.answer),
          correct: state.correct,
          checkedAt: new Date().toISOString(),
          contentVersion: lesson.version,
        });
        if (!state.correct) state.mistakes++;
        break;
      case 'hint':
        state.hints = Math.min(task.hints.length, state.hints + 1);
        break;
      case 'solution':
        state.solution = true;
        break;
      case 'selfReview':
        if (task.kind === 'written') {
          if (
            typeof state.answer !== 'string' ||
            state.answer.trim().length < 20
          )
            throw new DomainError('Write your response before reviewing it');
        } else if (task.kind === 'report') {
          if (!state.correct || !mark(task, state.answer))
            throw new DomainError(
              'Check and correct the factual report fields before self-review',
            );
          if (
            !isRecord(state.answer) ||
            task.fields.some(
              (f) =>
                f.kind === 'reasoning' &&
                !String((state.answer as ReportAnswer)[f.id] ?? '').trim(),
            )
          )
            throw new DomainError(
              'Complete the reasoning fields, using Unknown or Not Established where appropriate',
            );
        } else throw new DomainError('This activity does not use self-review');
        state.reviewed = true;
        break;
      case 'dismissReview':
        if (task.kind === 'written')
          throw new DomainError('Writing has no deterministic mistake review');
        state.reviewDismissedMistakes = state.mistakes;
        break;
      case 'restoreReview':
        state.reviewDismissedMistakes = 0;
        break;
    }
  }
  next.revision++;
  next.updatedAt = new Date().toISOString();
  return next;
}
