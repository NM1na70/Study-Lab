// Import report contracts, safe display helpers and local disclosure state
import { useRef, useState } from 'react';
import type {
  Lesson,
  Progress,
  ReportAnswer,
  ReportValue,
  Task,
  TaskProgress,
} from '../shared/schema.js';
import {
  displayAnswer,
  displayField,
  findingStatus,
  findingValue,
} from '../shared/domain.js';

// Assemble readable paragraphs from the learner's values without supplying missing answers
export function reportSections(task: Task, values: ReportAnswer) {
  const value = (id: string) =>
    displayField(
      task.fields.find((field) => field.id === id)!,
      values[id],
    );
  if (task.reportLayout.length)
    return task.reportLayout.map((section) => ({
      title: section.title,
      text: section.sentences
        .map((sentence) =>
          sentence.replace(/\{([a-z0-9-]+)\}/g, (_match, id: string) =>
            value(id),
          ),
        )
        .join('\n'),
    }));
  return [
    {
      title: 'Observed Activity',
      text: `HTTP requests were observed from ${value('source')} to ${value('destination')} — the first request occurred at ${value('observed-at')} ${value('time-zone')}`,
    },
    {
      title: 'Supporting Evidence',
      text: `The requests appear in ${value('frames')}, using ${value('method')} and requesting ${value('uri')} — the requests occur approximately every ${value('interval')} seconds`,
    },
    {
      title: 'Assessment And Uncertainty',
      text: `My assessment of the observed pattern is ${value('assessment')} — evidence supporting this assessment: ${value('evidence')}\nWhy this supports the assessment: ${value('assessment-reason')}\nThis capture does not establish: ${value('limitations')}`,
    },
    {
      title: 'Recommended Next Steps',
      text: `The recommended next investigation step is: ${value('next-step')}\nWhy this would help: ${value('next-reason')}`,
    },
  ];
}

// Display only the learner's assembled report without adding model values or assessment labels
export function ReportText({
  task,
  values,
}: {
  task: Task;
  values: ReportAnswer;
}) {
  return (
    <>
      {reportSections(task, values).map((section) => (
        <section key={section.title}>
          <h3>{section.title}</h3>
          <p className="report-paragraph">{section.text}</p>
        </section>
      ))}
    </>
  );
}

// Edit content-defined report fields while keeping copied findings and preview separate from assessment
export function ReportBuilder({
  task,
  values,
  edit,
  lesson,
  progress,
  state,
  onCopy,
  busy,
}: {
  task: Task;
  values: ReportAnswer;
  edit: (values: ReportAnswer) => void;
  lesson?: Lesson;
  progress?: Progress;
  state: TaskProgress;
  onCopy: (id: string) => Promise<boolean>;
  busy: boolean;
}) {
  // Retain only display state locally; all learner values stay in the card's autosaved draft
  const [preview, setPreview] = useState(false);
  const [replacement, setReplacement] = useState<string>();
  const previewHeading = useRef<HTMLHeadingElement>(null);
  const builderHeading = useRef<HTMLHeadingElement>(null);
  const overwrite = useRef<HTMLDialogElement>(null);
  const copyOpener = useRef<HTMLButtonElement | null>(null);
  const inputId = (id: string) => `report-${task.id}-${id}`;
  const set = (id: string, value: ReportValue) =>
    edit({ ...values, [id]: value });

  // Give inline controls persistent accessible labels independent of sentence wrapping
  function control(id: string) {
    const field = task.fields.find((field) => field.id === id)!;
    const value = values[id];
    const label = (
      <label className="sr-only" htmlFor={inputId(id)}>
        {field.label}
      </label>
    );
    if (field.kind === 'multiple')
      return (
        <fieldset className="inline-choices">
          <legend>{field.label}</legend>
          {field.options.map((option) => (
            <label key={option.id}>
              <input
                type="checkbox"
                checked={Array.isArray(value) && value.includes(option.id)}
                onChange={(event) =>
                  set(
                    id,
                    event.target.checked
                      ? [...(Array.isArray(value) ? value : []), option.id]
                      : (Array.isArray(value) ? value : []).filter(
                          (item) => item !== option.id,
                        ),
                  )
                }
              />
              {option.label}
            </label>
          ))}
        </fieldset>
      );
    if (field.kind === 'select')
      return (
        <span className={`report-blank blank-${id}`}>
          {label}
          <select
            id={inputId(id)}
            value={typeof value === 'string' ? value : ''}
            onChange={(event) => set(id, event.target.value)}
          >
            <option value="">Choose An Option</option>
            {field.options.map((option) => (
              <option value={option.id} key={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </span>
      );
    if (field.kind === 'reasoning')
      return (
        <span className="report-reasoning">
          <label htmlFor={inputId(id)}>{field.label}</label>
          <textarea
            id={inputId(id)}
            rows={2}
            maxLength={2000}
            value={typeof value === 'string' ? value : ''}
            onChange={(event) => set(id, event.target.value)}
            aria-describedby={`${inputId(id)}-help`}
          />
          <small id={`${inputId(id)}-help`}>{field.hint}</small>
        </span>
      );
    return (
      <span className={`report-blank blank-${id}`}>
        {label}
        <input
          id={inputId(id)}
          value={typeof value === 'string' ? value : ''}
          maxLength={2000}
          onChange={(event) => set(id, event.target.value)}
          autoComplete="off"
          spellCheck={false}
        />
      </span>
    );
  }

  // Ask before replacing a different report value and compare selection arrays without order sensitivity
  async function requestCopy(id: string, button: HTMLButtonElement) {
    const finding = findingValue(task, id, progress?.tasks[id]);
    if (!finding) return;
    const existing = values[finding.fieldId];
    if (
      existing !== undefined &&
      (Array.isArray(existing) ? existing.length : existing.trim()) &&
      JSON.stringify(
        Array.isArray(existing) ? [...existing].sort() : existing,
      ) !==
        JSON.stringify(
          Array.isArray(finding.value)
            ? [...finding.value].sort()
            : finding.value,
        )
    ) {
      copyOpener.current = button;
      setReplacement(id);
      overwrite.current?.showModal();
      return;
    }
    await onCopy(id);
  }
  return (
    <>
      <details className="investigation-notes">
        <summary>
          {lesson?.course === 'English'
            ? 'My Handover Notes'
            : 'My Investigation Notes'}
        </summary>
        <p>
          Your saved findings, including unchecked or incorrect answers — using
          a finding copies your value without checking the report
        </p>
        {lesson && progress ? (
          lesson.tasks
            .filter(
              (source) =>
                source.id !== task.id &&
                progress.tasks[source.id] !== undefined,
            )
            .map((source) => {
              const saved = progress.tasks[source.id];
              const copy = findingValue(task, source.id, saved);
              return (
                <article key={source.id}>
                  <h3>{source.prompt}</h3>
                  <p>
                    {displayAnswer(source, saved.answer) || '[No saved answer]'}
                  </p>
                  <p>{findingStatus(saved)}</p>
                  {copy && (
                    <button
                      disabled={busy}
                      onClick={(event) =>
                        void requestCopy(source.id, event.currentTarget)
                      }
                    >
                      Use My Finding
                      <span className="sr-only"> — {source.prompt}</span>
                    </button>
                  )}
                </article>
              );
            })
        ) : (
          <p>No saved findings are available yet</p>
        )}
      </details>
      <h3 ref={builderHeading} tabIndex={-1}>
        {lesson?.course === 'English'
          ? 'Handover Builder'
          : 'Investigation Report Builder'}
      </h3>
      {task.reportLayout.length ? (
        <div className="report-builder">
          {task.reportLayout.map((section) => (
            <section key={section.title}>
              <h3>{section.title}</h3>
              {section.sentences.map((sentence, index) => (
                <div className="report-sentence" key={index}>
                  {sentence
                    .split(/(\{[a-z0-9-]+\})/)
                    .map((part, partIndex) =>
                      /^\{/.test(part) ? (
                        <span key={partIndex}>
                          {control(part.slice(1, -1))}
                        </span>
                      ) : (
                        part
                      ),
                    )}
                </div>
              ))}
            </section>
          ))}
        </div>
      ) : (
        <>
          <div className="report-builder">
            <section>
              <h3>Observed Activity</h3>
              <p className="report-sentence">
                HTTP requests were observed from {control('source')} to{' '}
                {control('destination')}
              </p>
              <p className="report-sentence">
                The first request occurred at {control('observed-at')}{' '}
                {control('time-zone')}
              </p>
            </section>
            <section>
              <h3>Supporting Evidence</h3>
              <div className="report-sentence">
                The requests appear in frames {control('frames')} using{' '}
                {control('method')} and requesting {control('uri')}
              </div>
              <p className="report-sentence">
                The requests occur approximately every {control('interval')}{' '}
                seconds
              </p>
            </section>
            <section>
              <h3>Assessment And Uncertainty</h3>
              <p className="report-sentence">
                My assessment of the observed pattern is {control('assessment')}
              </p>
              <p className="report-sentence">
                Evidence supporting this assessment: {control('evidence')}
              </p>
              {control('assessment-reason')}
              <div className="report-sentence">
                This capture does not establish {control('limitations')}
              </div>
            </section>
            <section>
              <h3>Recommended Next Steps</h3>
              <p className="report-sentence">
                The next investigation step is {control('next-step')}
              </p>
              {control('next-reason')}
            </section>
          </div>
        </>
      )}

      {/* Display copy-time provenance without treating a copied finding as a checked report */}
      {!!state.findingProvenance && (
        <details>
          <summary>Finding Provenance</summary>
          {Object.entries(state.findingProvenance).map(([id, provenance]) => (
            <p key={id}>
              {task.fields.find((field) => field.id === id)?.label}: copied from
              your saved finding — {provenance.status} at copy time — report
              checks are separate
            </p>
          ))}
        </details>
      )}
      <button
        className="secondary"
        onClick={() => {
          setPreview(true);
          requestAnimationFrame(() => {
            previewHeading.current?.focus();
            previewHeading.current?.scrollIntoView({ block: 'start' });
          });
        }}
      >
        Preview Report
      </button>
      {preview && (
        <section className="learner-report-preview">
          <h2 ref={previewHeading} tabIndex={-1}>
            Your Report Preview
          </h2>
          <p>
            Your current entries — previewing does not check or complete the
            report
          </p>
          <ReportText task={task} values={values} />
          <button
            className="secondary"
            onClick={() => {
              builderHeading.current?.focus();
              builderHeading.current?.scrollIntoView({ block: 'start' });
            }}
          >
            Return To Editing
          </button>
        </section>
      )}
      <dialog
        ref={overwrite}
        aria-labelledby="replace-finding-heading"
        onClose={() => copyOpener.current?.focus()}
      >
        <h2 id="replace-finding-heading">Replace Your Report Entry?</h2>
        <p>
          This field already contains a different value — use your saved finding
          instead?
        </p>
        <div className="actions">
          <button
            disabled={busy}
            onClick={async () => {
              if (replacement && (await onCopy(replacement)))
                overwrite.current?.close();
            }}
          >
            Replace Entry
          </button>
          <button
            className="secondary"
            onClick={() => overwrite.current?.close()}
          >
            Keep Current Entry
          </button>
        </div>
      </dialog>
    </>
  );
}
