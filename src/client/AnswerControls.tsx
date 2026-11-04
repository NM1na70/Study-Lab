// Import native control event types and the shared typed answer contract
import type { KeyboardEvent } from 'react';
import type { Answer, Task } from '../shared/schema.js';

// Emphasise literal evidence tokens while leaving all content escaped by React
export function EvidenceText({
  text,
  emphasis,
}: {
  text: string;
  emphasis: string[];
}) {
  const tokens = [...emphasis]
    .filter(Boolean)
    .sort((a, b) => b.length - a.length);
  const parts: { text: string; bold: boolean }[] = [];
  let remaining = text;
  while (remaining) {
    const matches = tokens
      .map((token) => ({ token, at: remaining.indexOf(token) }))
      .filter((match) => match.at >= 0)
      .sort((a, b) => a.at - b.at || b.token.length - a.token.length);
    const match = matches[0];
    if (!match) {
      parts.push({ text: remaining, bold: false });
      break;
    }
    if (match.at)
      parts.push({ text: remaining.slice(0, match.at), bold: false });
    parts.push({ text: match.token, bold: true });
    remaining = remaining.slice(match.at + match.token.length);
  }
  return (
    <>
      {parts.map((part, index) =>
        part.bold ? <strong key={index}>{part.text}</strong> : part.text,
      )}
    </>
  );
}

// Choose native controls from the task objective and persist stable option or field IDs
export function AnswerControls({
  task,
  answer,
  edit,
  onShortEnter,
}: {
  task: Task;
  answer: Answer;
  edit: (answer: Answer) => void;
  onShortEnter: (event: KeyboardEvent<HTMLInputElement>) => void;
}) {
  const id = `answer-${task.id}`;
  if (task.kind === 'choice' || task.kind === 'multiple')
    return (
      <fieldset>
        <legend>Your answer</legend>
        {task.options.map((option) => (
          <label className="check" key={option.id}>
            <input
              type={task.kind === 'choice' ? 'radio' : 'checkbox'}
              name={id}
              value={option.id}
              checked={
                task.kind === 'choice'
                  ? answer === option.id
                  : Array.isArray(answer) && answer.includes(option.id)
              }
              onChange={(e) =>
                edit(
                  task.kind === 'choice'
                    ? option.id
                    : e.target.checked
                      ? [...(Array.isArray(answer) ? answer : []), option.id]
                      : (Array.isArray(answer) ? answer : []).filter(
                          (value) => value !== option.id,
                        ),
                )
              }
            />
            {option.label}
          </label>
        ))}
      </fieldset>
    );
  if (task.kind === 'select')
    return (
      <>
        <label htmlFor={id}>Your answer</label>
        <select
          id={id}
          value={String(answer)}
          onChange={(e) => edit(e.target.value)}
        >
          <option value="">Choose An Option</option>
          {task.options.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
      </>
    );
  return (
    <>
      <label htmlFor={id}>Your answer</label>
      {task.kind === 'written' ? (
        <textarea
          id={id}
          rows={7}
          value={String(answer)}
          maxLength={10000}
          onChange={(e) => edit(e.target.value)}
        />
      ) : (
        <>
          <input
            id={id}
            value={String(answer)}
            maxLength={10000}
            onChange={(e) => edit(e.target.value)}
            onKeyDown={onShortEnter}
            aria-describedby={`${id}-help`}
            autoComplete="off"
            spellCheck={false}
          />
          <small id={`${id}-help`}>
            Press Enter to focus Check Answer, then press Enter again to check
          </small>
        </>
      )}
    </>
  );
}
