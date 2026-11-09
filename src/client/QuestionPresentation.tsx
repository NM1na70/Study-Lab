// Import typed activities and safe display helpers without changing deterministic marking
import type { Task, TaskProgress } from '../shared/schema.js';
import {
  displayAnswer,
  displayField,
  exampleAnswer,
  isRecord,
} from '../shared/domain.js';

// Present authored instructions and exercise text separately, retaining heading focus and plain-text escaping
export function QuestionPrompt({ task }: { task: Task }) {
  return (
    <>
      <h2 tabIndex={-1} id={`task-${task.id}`}>
        {task.prompt}
      </h2>
      {!!task.instructions.length && (
        <ul className="question-instructions">
          {task.instructions.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      )}
      {task.exercise && (
        <blockquote className="question-exercise">{task.exercise}</blockquote>
      )}
    </>
  );
}

// Capitalise only explicitly authored common-word display values, preserving accepted keys and technical evidence
export function solutionAnswer(task: Task) {
  const answer = displayAnswer(task, exampleAnswer(task));
  return task.solutionDisplay === 'sentence'
    ? answer.charAt(0).toLocaleUpperCase('en-AU') + answer.slice(1)
    : answer;
}

// Group fields using validated layout placeholders rather than guessing structure from natural-language sentences
function exampleGroups(task: Task) {
  const used = new Set<string>();

  // The original capture report predates layout metadata; keep its established evidence groups explicit
  const layouts = task.reportLayout.length
    ? task.reportLayout
    : [
        {
          title: 'Observed Activity',
          sentences: ['{source} {destination} {observed-at} {time-zone}'],
        },
        {
          title: 'Supporting Evidence',
          sentences: ['{frames} {method} {uri} {interval}'],
        },
        {
          title: 'Assessment And Uncertainty',
          sentences: [
            '{assessment} {evidence} {assessment-reason} {limitations}',
          ],
        },
        {
          title: 'Recommended Next Steps',
          sentences: ['{next-step} {next-reason}'],
        },
      ];
  const groups = layouts.map((section) => {
    const ids = section.sentences.flatMap((sentence) =>
      [...sentence.matchAll(/\{([a-z0-9-]+)\}/g)].map((match) => match[1]),
    );
    const fields = task.fields.filter(
      (field) => ids.includes(field.id) && !used.has(field.id),
    );
    fields.forEach((field) => used.add(field.id));
    return { title: section.title, fields };
  });
  const remaining = task.fields.filter((field) => !used.has(field.id));
  if (remaining.length)
    groups.push({ title: 'Report Findings', fields: remaining });
  return groups.filter((group) => group.fields.length);
}

// Reveal labelled examples only in the solution panel, keeping the learner's report preview entirely independent
export function SolutionAnswer({ task }: { task: Task }) {
  if (task.kind === 'report')
    return (
      <>
        {exampleGroups(task).map((group) => (
          <section key={group.title}>
            <h4>{group.title}</h4>
            <ul className="example-report-fields">
              {group.fields.map((field) => (
                <li key={field.id}>
                  <strong>{field.label}:</strong>{' '}
                  {displayField(field, field.example)}
                  {field.kind === 'reasoning' && (
                    <small className="reasoning-note">
                      Example Reasoning — Self-Review Required
                    </small>
                  )}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </>
    );
  if (task.kind === 'written')
    return <div className="written-example">{task.example}</div>;
  return (
    <p className="solution-answer">
      <strong>{solutionAnswer(task)}</strong>
    </p>
  );
}

// Read only submitted objective results and distinguish missing input without grading open reasoning
export function CheckedReportFeedback({
  task,
  state,
}: {
  task: Task;
  state: TaskProgress;
}) {
  const answer = isRecord(state.answer) ? state.answer : {};
  return (
    <>
      <ul className="checked-report-fields">
        {task.fields
          .filter((field) => field.kind !== 'reasoning')
          .map((field) => {
            const value = answer[field.id];
            const missing =
              value === undefined ||
              (Array.isArray(value) ? !value.length : !value.trim());
            const status = missing
              ? 'Not Answered'
              : state.fieldResults?.[field.id]
                ? 'Correct'
                : 'Wrong';
            return (
              <li key={field.id}>
                <strong>{field.label}:</strong> {displayField(field, value)}{' '}
                <span>— {status}</span>
                {status === 'Wrong' && (
                  <p className="field-guidance">{field.feedback}</p>
                )}
              </li>
            );
          })}
      </ul>
      <p>
        Reasoning:{' '}
        {state.reviewed
          ? 'Self-Review Recorded'
          : 'Self-Review Required — Not Automatically Graded'}
      </p>
    </>
  );
}
