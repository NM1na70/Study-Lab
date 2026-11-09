// Import React hooks, task types, and default task progress
import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  Answer,
  Mutation,
  Task,
  TaskProgress,
  Lesson,
  Progress,
} from '../shared/schema.js';
import { DefenceLab } from './Lab';
import { registerNavigation } from './navigation';
import { AiFeedback } from './Ai';
import { ReportBuilder } from './ReportBuilder';
import {
  QuestionPrompt,
  SolutionAnswer,
  CheckedReportFeedback,
} from './QuestionPresentation';
import { AnswerControls, EvidenceText } from './AnswerControls';
import { emptyTask, validateAnswer, isRecord } from '../shared/domain.js';

// Define the task data and callbacks received from the parent component
interface Props {
  task: Task;
  state?: TaskProgress;
  enqueue: (m: Omit<Mutation, 'revision'>) => Promise<boolean>;
  lesson?: Lesson;
  progress?: Progress;
  confirmed?: () => Progress;
  onRetry?: () => void;
  onProgress?: (progress: Progress) => void;
  onNext?: () => Promise<void>;
  registerFlush?: (flush: (() => Promise<boolean>) | null) => void;
}

// Treat structured empty drafts as unanswered rather than claiming they are saved work
function hasContent(answer: Answer) {
  return typeof answer === 'string'
    ? !!answer.trim()
    : Array.isArray(answer)
      ? answer.length > 0
      : Object.values(answer).some((value) =>
          Array.isArray(value) ? value.length : value.trim(),
        );
}

// Manage and display one study activity
export function TaskCard({
  task,
  state = emptyTask(task),
  enqueue,
  lesson,
  progress,
  confirmed,
  onRetry,
  onProgress,
  onNext,
  registerFlush,
}: Props) {
  // Track the answer, unsaved edits, review confirmation, pending actions, and autosave references
  const [answer, setAnswer] = useState(state.answer);
  const [dirty, setDirty] = useState(false);
  const [reviewed, setReviewed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [reportError, setReportError] = useState('');
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const pendingAnswer = useRef(answer);
  const mounted = useRef(true);
  const checkRef = useRef<HTMLButtonElement>(null);
  const heldEnter = useRef(false);
  const composing = useRef(false);
  const actionPending = useRef(false);
  const copyPending = useRef<Promise<boolean> | null>(null);

  // Require an Enter release before the focused button can accept another deliberate press
  useEffect(() => {
    const release = (event: KeyboardEvent) => {
      if (event.key === 'Enter') heldEnter.current = false;
    };
    window.addEventListener('keyup', release);
    const blur = () => {
      heldEnter.current = false;
    };
    window.addEventListener('blur', blur);
    return () => {
      window.removeEventListener('keyup', release);
      window.removeEventListener('blur', blur);
    };
  }, []);

  // Track whether the card is mounted and request a browser warning when edits are unsaved
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;

      // Keep the pending autosave timer running after this card unmounts
      // Ordinary in-app navigation explicitly saves before leaving
    };
  }, []);
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (dirty) {
        event.preventDefault();
        event.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  // Save draft answers and save before navigating through ordinary in-app links
  const persist = useCallback(
    async (text: Answer) => {
      if (task.labScenario) return true;
      const ok = await enqueue({
        action: 'draft',
        taskId: task.id,
        answer: text,
      });

      // Clear unsaved status only if this card is mounted and the saved answer is still current
      if (ok && mounted.current && text === pendingAnswer.current)
        setDirty(false);
      return ok;
    },
    [enqueue, task.id, task.labScenario],
  );

  // Wait for a pending finding copy before saving the latest draft for departure
  const flush = useCallback(async () => {
    clearTimeout(timer.current);
    if (copyPending.current && !(await copyPending.current)) return false;
    return persist(pendingAnswer.current);
  }, [persist]);
  useEffect(() => {
    registerFlush?.(flush);
    return () => registerFlush?.(null);
  }, [registerFlush, flush]);
  useEffect(() => registerNavigation(flush), [flush]);

  // Update the answer, reset review confirmation, and autosave after 350 ms without another edit
  function edit(text: Answer) {
    setAnswer(text);
    pendingAnswer.current = text;
    setDirty(true);
    setReviewed(false);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      void persist(text);
    }, 350);
  }

  // Save the latest answer before performing an action or opening the next activity
  async function act(action: Mutation['action']) {
    if (actionPending.current) return;
    actionPending.current = true;
    setReportError('');
    clearTimeout(timer.current);
    setBusy(true);
    try {
      const saved = await persist(pendingAnswer.current);
      const ok = saved && (await enqueue({ action, taskId: task.id }));
      if (!ok && task.kind === 'report' && action === 'check')
        setReportError(
          'The report could not be saved or checked — your draft is still here',
        );
    } finally {
      actionPending.current = false;
      setBusy(false);
    }
  }

  // Keep the current card mounted until its draft saves successfully
  async function next() {
    if (actionPending.current) return;
    actionPending.current = true;
    clearTimeout(timer.current);
    setBusy(true);
    try {
      if (await persist(pendingAnswer.current)) await onNext?.();
    } finally {
      actionPending.current = false;
      setBusy(false);
    }
  }

  // Copy only server-confirmed saved findings and preserve their assessment provenance separately
  async function performCopy(sourceTaskId: string) {
    if (actionPending.current || !confirmed) return false;
    actionPending.current = true;
    setBusy(true);
    try {
      clearTimeout(timer.current);
      if (!(await persist(pendingAnswer.current))) return false;
      if (
        !(await enqueue({
          action: 'useFinding',
          taskId: task.id,
          sourceTaskId,
        }))
      )
        return false;
      const answer = confirmed().tasks[task.id].answer;
      setAnswer(answer);
      pendingAnswer.current = answer;
      setDirty(false);
      setReviewed(false);
      return true;
    } finally {
      actionPending.current = false;
      setBusy(false);
    }
  }

  // Expose the outstanding copy to navigation and clear only the promise that actually finished
  function copyFinding(sourceTaskId: string) {
    const job = performCopy(sourceTaskId);
    copyPending.current = job;
    void job.finally(() => {
      if (copyPending.current === job) copyPending.current = null;
    });
    return job;
  }

  // Display the question, answer box, save status, and checking or self-review controls
  return (
    <section
      className="task-card"
      aria-labelledby={`task-${task.id}`}
      onCompositionStart={() => {
        composing.current = true;
      }}
      onCompositionEnd={() => {
        composing.current = false;
      }}
    >
      <span className="eyebrow">
        {task.stage} ·{' '}
        {
          {
            exact: 'Short Answer',
            written: 'Self-Assessed Writing',
            choice: 'Multiple Choice',
            multiple: 'Select All That Apply',
            select: 'Drop-Down',
            report: 'Guided Report',
          }[task.kind]
        }
      </span>
      {task.tier && <p>{task.tier}</p>}
      <QuestionPrompt task={task} />
      {task.passage && (
        <section aria-label="Reading Passage">
          <h3>{task.passage.title}</h3>
          <p>
            {task.passage.difficulty} — {task.passage.reuse}
          </p>
          <p>{task.passage.text}</p>
          <p>
            {task.passage.publisher} · Published {task.passage.published} ·
            Retrieved {task.passage.retrieved} · Snapshot {task.passage.id} v
            {task.passage.version}
          </p>
          <a href={task.passage.url}>Original Source</a>
        </section>
      )}
      {task.kind === 'report' && !task.reportLayout.length && (
        <p>
          Simplified learning template informed by Australian Signals
          Directorate guidance — not an official government reporting form
          <br />
          Use the synthetic capture for facts, and Unknown or Not Established
          where the evidence cannot support a conclusion
        </p>
      )}
      {task.kind === 'report' && task.reportLayout.length > 0 && (
        <p>
          {lesson?.course === 'English'
            ? 'Use the supplied workplace brief for facts and keep awaited actions separate from completed actions'
            : 'Use the supplied synthetic records for facts and keep unsupported conclusions explicitly uncertain'}
          {' — '}check factual fields separately from reviewing your reasoning
        </p>
      )}

      {/* Use server verification for lab questions and ordinary draft controls for other objectives */}
      {task.labScenario ? (
        <DefenceLab progress={progress} onProgress={onProgress} />
      ) : task.kind === 'report' && isRecord(answer) ? (
        <fieldset className="activity-fieldset" disabled={busy}>
          <ReportBuilder
            task={task}
            values={answer}
            edit={edit}
            lesson={lesson}
            progress={progress}
            state={state}
            onCopy={copyFinding}
            busy={busy}
          />
        </fieldset>
      ) : (
        <AnswerControls
          task={task}
          answer={answer}
          edit={edit}
          onShortEnter={(event) => {
            if (
              event.key !== 'Enter' ||
              composing.current ||
              event.nativeEvent.isComposing ||
              event.nativeEvent.keyCode === 229
            )
              return;
            event.preventDefault();
            if (event.repeat) return;
            heldEnter.current = true;
            checkRef.current?.focus();
          }}
        />
      )}
      <p className="muted" role="status">
        {dirty
          ? 'Unsaved edits'
          : hasContent(state.answer)
            ? 'Answer saved'
            : 'No answer yet'}{' '}
        · {state.attempts} checked attempts
      </p>
      {task.kind !== 'written' && !task.labScenario && (
        <button
          ref={checkRef}
          onKeyDown={(event) => {
            if (
              event.key === 'Enter' &&
              (heldEnter.current ||
                event.repeat ||
                composing.current ||
                event.nativeEvent.keyCode === 229 ||
                event.nativeEvent.isComposing)
            )
              event.preventDefault();
          }}
          disabled={
            busy || !validateAnswer(task, answer) || !hasContent(answer)
          }
          onClick={() => void act('check')}
        >
          {task.kind === 'report' ? 'Check Report' : 'Check Answer'}
        </button>
      )}
      {reportError && (
        <p role="alert" className="feedback retry">
          {reportError}
          {onRetry && (
            <button
              disabled={busy}
              onClick={() => {
                onRetry();
                void act('check');
              }}
            >
              Retry Report Check
            </button>
          )}
        </p>
      )}

      {/* Show submitted results only while they still apply to the current answer, leaving reasoning ungraded */}
      {state.attempts > 0 &&
        state.checked !== false &&
        !dirty &&
        task.kind !== 'written' && (
          <div
            className={`feedback ${state.correct ? 'good' : 'retry'}`}
            role="status"
          >
            <strong>
              {state.correct
                ? task.kind === 'report'
                  ? 'Objective Report Checks Met'
                  : 'Correct'
                : 'Not Correct Yet — Try Again'}
            </strong>
            <p>
              <EvidenceText
                text={
                  state.correct || state.solution
                    ? task.explanation
                    : task.feedback
                }
                emphasis={task.emphasis}
              />
            </p>
            {task.kind === 'report' && (
              <CheckedReportFeedback task={task} state={state} />
            )}
          </div>
        )}

      {state.attempts > 0 &&
        (dirty || state.checked === false) &&
        task.kind !== 'written' && (
          <p className="muted">
            Answer changed — check again to update feedback
          </p>
        )}

      {/* Keep explicit reasoning self-review separate from objective answer checks */}
      {(task.kind === 'written' || task.kind === 'report') && (
        <div className="rubric">
          <h3>Self-review · no automatic technical grade</h3>
          <ul>
            {task.rubric.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
          <h3>Language checklist</h3>
          <ul>
            {task.languageChecklist.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
          <label className="check">
            <input
              type="checkbox"
              checked={reviewed}
              onChange={(e) => setReviewed(e.target.checked)}
            />
            I compared my response with every rubric item and corrected it.
          </label>
          <button
            disabled={
              busy ||
              !reviewed ||
              (task.kind === 'written'
                ? String(answer).trim().length < 20
                : !state.correct ||
                  dirty ||
                  !isRecord(answer) ||
                  task.fields.some(
                    (field) =>
                      field.kind === 'reasoning' &&
                      !String(answer[field.id] ?? '').trim(),
                  ))
            }
            onClick={() => void act('selfReview')}
          >
            Record Self-Review
          </button>
        </div>
      )}
      {state.reviewed && !dirty && (
        <p className="feedback good" role="status">
          Self-review recorded. This is your assessment, not a verified
          technical grade.
        </p>
      )}

      {/* Provide hints, a revealed solution, and navigation to the next activity */}
      <div className="actions">
        <button
          className="secondary"
          disabled={busy || state.hints >= task.hints.length}
          onClick={() => void act('hint')}
        >
          Next Hint ({state.hints}/{task.hints.length})
        </button>
        <button
          className="text-button"
          disabled={busy || state.solution}
          onClick={() => void act('solution')}
        >
          {task.kind === 'report'
            ? 'Reveal Example Report'
            : task.kind === 'written'
              ? 'Reveal Example Answer'
              : 'Reveal Full Solution'}
        </button>
      </div>
      {task.hints.slice(0, state.hints).map((h, i) => (
        <p className="hint" key={h}>
          <strong>Hint {i + 1}:</strong> {h}
        </p>
      ))}
      {state.solution && (
        <aside className="solution">
          <h3>
            {task.kind === 'report'
              ? 'Example Report'
              : task.kind === 'written'
                ? 'Example Answer'
                : 'Full Solution'}
          </h3>
          <SolutionAnswer task={task} />
          <p>{task.explanation}</p>
          <small>
            Solution use is recorded. Finishing with assistance does not
            establish independent mastery.
          </small>
        </aside>
      )}
      {state.previousWork?.map((work, index) => (
        <details key={index}>
          <summary>
            Saved Work From Content Version {work.contentVersion}
          </summary>
          <pre>
            {typeof work.answer === 'string'
              ? work.answer
              : JSON.stringify(work.answer, null, 2)}
          </pre>
          <p>Earlier checks and assistance remain in your history</p>
        </details>
      ))}
      {lesson && ['written', 'report'].includes(task.kind) && (
        <AiFeedback
          lessonId={lesson.id}
          taskId={task.id}
          flush={flush}
          onChange={onProgress}
        />
      )}
      {onNext && (
        <button className="next" disabled={busy} onClick={() => void next()}>
          Save And Next Activity →
        </button>
      )}
    </section>
  );
}
