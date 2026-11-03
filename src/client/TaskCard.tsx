import { useCallback, useEffect, useRef, useState } from 'react';
import type { Mutation, Task, TaskProgress } from '../shared/schema.js';
import { emptyTask } from '../shared/domain.js';
interface Props {
  task: Task;
  state?: TaskProgress;
  enqueue: (m: Omit<Mutation, 'revision'>) => Promise<boolean>;
  onNext?: () => Promise<void>;
  registerFlush?: (flush: (() => Promise<boolean>) | null) => void;
}
export function TaskCard({
  task,
  state = emptyTask(),
  enqueue,
  onNext,
  registerFlush,
}: Props) {
  const [answer, setAnswer] = useState(state.answer);
  const [dirty, setDirty] = useState(false);
  const [reviewed, setReviewed] = useState(false);
  const [busy, setBusy] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const pendingAnswer = useRef(answer);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      // Let a pending debounce finish after browser Back/Forward unmounts this card.
      // Ordinary in-app navigation explicitly flushes before leaving.
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
  const persist = useCallback(
    async (text: string) => {
      const ok = await enqueue({
        action: 'draft',
        taskId: task.id,
        answer: text,
      });
      if (ok && mounted.current && text === pendingAnswer.current)
        setDirty(false);
      return ok;
    },
    [enqueue, task.id],
  );
  const flush = useCallback(() => {
    clearTimeout(timer.current);
    return persist(pendingAnswer.current);
  }, [persist]);
  useEffect(() => {
    registerFlush?.(flush);
    return () => registerFlush?.(null);
  }, [registerFlush, flush]);
  useEffect(() => {
    const navigate = (event: MouseEvent) => {
      const anchor =
        event.target instanceof Element
          ? event.target.closest('a[href^="#/"]')
          : null;
      if (
        !anchor ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey ||
        event.button !== 0
      )
        return;
      event.preventDefault();
      void flush().then((ok) => {
        if (ok) location.hash = anchor.getAttribute('href')!;
      });
    };
    document.addEventListener('click', navigate, true);
    return () => document.removeEventListener('click', navigate, true);
  }, [flush]);
  function edit(text: string) {
    setAnswer(text);
    pendingAnswer.current = text;
    setDirty(true);
    setReviewed(false);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      void persist(text);
    }, 350);
  }
  async function act(action: Mutation['action']) {
    clearTimeout(timer.current);
    setBusy(true);
    try {
      if (await persist(pendingAnswer.current))
        await enqueue({ action, taskId: task.id });
    } finally {
      setBusy(false);
    }
  }
  async function next() {
    clearTimeout(timer.current);
    setBusy(true);
    try {
      if (await persist(pendingAnswer.current)) await onNext?.();
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="task-card" aria-labelledby={`task-${task.id}`}>
      <span className="eyebrow">
        {task.stage} ·{' '}
        {task.kind === 'written' ? 'Self-assessed writing' : 'Precise answer'}
      </span>
      <h2 id={`task-${task.id}`}>{task.prompt}</h2>
      <label htmlFor={`answer-${task.id}`}>Your answer</label>
      <textarea
        id={`answer-${task.id}`}
        rows={task.kind === 'written' ? 7 : 2}
        value={answer}
        maxLength={10000}
        onChange={(e) => edit(e.target.value)}
        spellCheck={task.kind === 'written'}
        autoComplete="off"
      />
      <p className="muted" role="status">
        {dirty
          ? 'Unsaved edits'
          : state.answer
            ? 'Answer saved'
            : 'No answer yet'}{' '}
        · {state.attempts} checked attempts
      </p>
      {task.kind === 'exact' ? (
        <button
          disabled={busy || !answer.trim()}
          onClick={() => void act('check')}
        >
          Check answer
        </button>
      ) : (
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
            disabled={busy || !reviewed || answer.trim().length < 20}
            onClick={() => void act('selfReview')}
          >
            Record self-review
          </button>
        </div>
      )}
      {state.reviewed && !dirty && (
        <p className="feedback good" role="status">
          Self-review recorded. This is your assessment, not a verified
          technical grade.
        </p>
      )}
      {state.attempts > 0 && !dirty && task.kind === 'exact' && (
        <div
          className={`feedback ${state.correct ? 'good' : 'retry'}`}
          role="status"
        >
          <strong>
            {state.correct ? 'Correct.' : 'Not correct yet. Try again.'}
          </strong>
          <p>
            {state.correct || state.solution ? task.explanation : task.feedback}
          </p>
        </div>
      )}
      <div className="actions">
        <button
          className="secondary"
          disabled={busy || state.hints >= task.hints.length}
          onClick={() => void act('hint')}
        >
          Next hint ({state.hints}/{task.hints.length})
        </button>
        <button
          className="text-button"
          disabled={busy || state.solution}
          onClick={() => void act('solution')}
        >
          {task.kind === 'written'
            ? 'Reveal example answer'
            : 'Reveal full solution'}
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
            {task.kind === 'written' ? 'Example answer' : 'Full solution'}
          </h3>
          <p>{task.example}</p>
          <p>{task.explanation}</p>
          <small>
            Solution use is recorded. Finishing with assistance does not
            establish independent mastery.
          </small>
        </aside>
      )}
      {onNext && (
        <button className="next" disabled={busy} onClick={() => void next()}>
          Save and next activity →
        </button>
      )}
    </section>
  );
}
