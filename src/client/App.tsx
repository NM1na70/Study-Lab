import { useCallback, useEffect, useRef, useState } from 'react';
import type { Lesson, Progress } from '../shared/schema.js';
import { satisfied } from '../shared/domain.js';
import { load, type Snapshot } from './api';
import { useProgress } from './use-progress';
import { TaskCard } from './TaskCard';
interface Evidence {
  sha256: string;
  frames: {
    frame: number;
    utc: string;
    source: string;
    destination: string;
    payload: string;
  }[];
}
function EvidenceSummary() {
  const [data, setData] = useState<Evidence>();
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    fetch('/evidence/summary.json')
      .then(async (r) => {
        if (!r.ok) throw new Error('Evidence unavailable');
        return r.json() as Promise<Evidence>;
      })
      .then((d) => {
        if (active) setData(d);
      })
      .catch(() => {
        if (active) setError('Could not load evidence. Reload to retry.');
      });
    return () => {
      active = false;
    };
  }, []);
  return (
    <details>
      <summary>
        Browser evidence summary · contains investigation spoilers
      </summary>
      {error ? (
        <p role="alert">{error}</p>
      ) : !data ? (
        <p>Loading evidence…</p>
      ) : (
        <>
          <p>
            Synthetic capture · 12 frames · original CC0 evidence. Full
            Wireshark work requires a desktop.
          </p>
          <div className="table-scroll">
            <table>
              <caption>Decoded packets · UTC</caption>
              <thead>
                <tr>
                  <th>Frame</th>
                  <th>Time</th>
                  <th>Source → destination</th>
                  <th>Payload</th>
                </tr>
              </thead>
              <tbody>
                {data.frames.map((f) => (
                  <tr key={f.frame}>
                    <td>{f.frame}</td>
                    <td>{f.utc}</td>
                    <td>
                      {f.source} → {f.destination}
                    </td>
                    <td>
                      <pre>{f.payload || 'TCP control packet'}</pre>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="hash">SHA256: {data.sha256}</p>
        </>
      )}
    </details>
  );
}
function LessonView({
  lesson,
  progress,
  onChange,
}: {
  lesson: Lesson;
  progress: Progress;
  onChange: (p: Progress) => void;
}) {
  const { enqueue, status, error, retry } = useProgress(progress, onChange);
  const [finishing, setFinishing] = useState(false);
  const [navigating, setNavigating] = useState(false);
  const flush = useRef<(() => Promise<boolean>) | null>(null);
  const registerFlush = useCallback((f: (() => Promise<boolean>) | null) => {
    flush.current = f;
  }, []);
  const step = progress.step;
  const task = lesson.tasks[step - 1];
  async function changeStep(value: number) {
    setNavigating(true);
    try {
      if (flush.current && !(await flush.current())) return;
      await enqueue({ action: 'step', step: value });
      window.scrollTo({ top: 0 });
    } finally {
      setNavigating(false);
    }
  }
  async function complete() {
    setFinishing(true);
    try {
      if (!flush.current || (await flush.current()))
        await enqueue({ action: 'complete' });
    } finally {
      setFinishing(false);
    }
  }
  return (
    <>
      <div className="lesson-heading">
        <div>
          <span className="eyebrow">
            {lesson.course} · {lesson.difficulty} · {lesson.minutes} minutes
          </span>
          <h1>{lesson.title}</h1>
        </div>
        <span className={`save-state ${error ? 'error' : ''}`} role="status">
          {status}
        </span>
      </div>
      {error && (
        <div className="feedback retry" role="alert">
          {error} Your text stays in this page. For a network error,{' '}
          <button onClick={retry}>Enable retry</button> then use Check answer or
          Save and next again. For a conflict, copy unsaved text before
          reloading.
        </div>
      )}
      <div className="progress-line">
        <progress
          aria-label="Lesson progress"
          value={satisfied(lesson, progress)}
          max={lesson.tasks.length}
        />
        <span>
          {satisfied(lesson, progress)}/{lesson.tasks.length} activities met
        </span>
      </div>
      <p className="muted">
        Completion: correct every precise answer and explicitly self-review the
        writing activity.{' '}
        {progress.completedAt
          ? `Completed ${new Date(progress.completedAt).toLocaleDateString('en-AU')}.`
          : 'Not completed yet.'}{' '}
        {Object.values(progress.tasks).some((t) => t.solution)
          ? 'Solutions used — assisted completion.'
          : ''}
      </p>
      <div className="study-layout">
        <aside className="study-map">
          <h2>Lesson route</h2>
          <ol>
            <li className={step === 0 ? 'current' : ''}>Learn & prepare</li>
            {lesson.tasks.map((t, i) => (
              <li key={t.id} className={step === i + 1 ? 'current' : ''}>
                {i + 1}. {t.stage}{' '}
                {progress.tasks[t.id]?.correct || progress.tasks[t.id]?.reviewed
                  ? '✓'
                  : ''}
              </li>
            ))}
          </ol>
          <p>
            All activities are unlocked. Use the selector to revisit any
            activity after saving your current answer.
          </p>
          <label htmlFor="step">Go to activity</label>
          <select
            id="step"
            disabled={navigating}
            value={step}
            onChange={(e) => void changeStep(Number(e.target.value))}
          >
            <option value={0}>Learn & prepare</option>
            {lesson.tasks.map((t, i) => (
              <option key={t.id} value={i + 1}>
                {i + 1}. {t.stage}
              </option>
            ))}
          </select>
          <p className="muted">Before jumping, wait for “Answer saved”.</p>
        </aside>
        <div className="study-content" aria-busy={navigating}>
          {step === 0 ? (
            <>
              <p className="lead">{lesson.summary}</p>
              <h2>Learning outcomes</h2>
              <ul>
                {lesson.objectives.map((o) => (
                  <li key={o}>{o}</li>
                ))}
              </ul>
              <h2>Before you start</h2>
              <ul>
                {lesson.prerequisites.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
              {lesson.evidence && (
                <p>
                  <a className="button" href={lesson.evidence} download>
                    Download synthetic PCAP · 1.4 KB
                  </a>
                </p>
              )}
              {lesson.teaching.map((s) => (
                <section className="teaching" key={s.title}>
                  <h2>{s.title}</h2>
                  <p>{s.body}</p>
                </section>
              ))}
              <button onClick={() => void changeStep(1)}>
                Start activities →
              </button>
            </>
          ) : task ? (
            <fieldset disabled={navigating} className="activity-fieldset">
              <TaskCard
                key={task.id}
                task={task}
                state={progress.tasks[task.id]}
                enqueue={enqueue}
                registerFlush={registerFlush}
                onNext={() =>
                  changeStep(Math.min(lesson.tasks.length, step + 1))
                }
              />
            </fieldset>
          ) : null}
          {lesson.evidence && <EvidenceSummary />}
          <section className="finish">
            <h2>Finish this lesson</h2>
            <p>
              {progress.completedAt
                ? 'Your completion is saved. You can revisit any activity. Editing an assessed answer reopens the lesson.'
                : 'You can retry as often as needed. Reading a solution alone does not complete an activity.'}
            </p>
            <button
              disabled={
                finishing ||
                satisfied(lesson, progress) !== lesson.tasks.length ||
                !!progress.completedAt
              }
              onClick={() => void complete()}
            >
              {progress.completedAt
                ? 'Lesson completed'
                : 'Mark lesson complete'}
            </button>
          </section>
          <details>
            <summary>Sources & content version {lesson.version}</summary>
            {lesson.sources.map((s) => (
              <div key={s.id}>
                <h3>
                  <a href={s.url} target="_blank" rel="noreferrer">
                    {s.title}
                  </a>
                </h3>
                <p>{s.supports}</p>
                <p className="muted">
                  Accessed {s.accessed}. {s.attribution}
                </p>
              </div>
            ))}
          </details>
        </div>
      </div>
    </>
  );
}
function Dashboard({ data }: { data: Snapshot }) {
  const completed = data.progress.filter((p) => p.completedAt).length;
  const recent = [...data.progress]
    .filter((p) => p.updatedAt && !p.completedAt)
    .sort((a, b) => (b.updatedAt ?? '').localeCompare(a.updatedAt ?? ''))[0];
  const next =
    recent?.lessonId ??
    data.lessons.find(
      (l) => !data.progress.find((p) => p.lessonId === l.id)?.completedAt,
    )?.id;
  return (
    <>
      <span className="eyebrow">Your local learning workspace</span>
      <div className="hero">
        <div>
          <h1>
            A little practice.
            <br />A clearer next step.
          </h1>
          <p className="lead">
            Build your English. Follow the evidence.
            <br />
            Learn at your own pace, with your work saved here.
          </p>
          {next ? (
            <a className="button" href={`#/lesson/${next}`}>
              Continue studying →
            </a>
          ) : (
            <p>
              Both lessons completed. Revisit a lesson or review your mistakes.
            </p>
          )}
        </div>
        <div className="stats">
          <strong>
            {completed}
            <span>/ {data.lessons.length}</span>
          </strong>
          <p>lessons completed</p>
          <span className="tag">No accounts · No AI required</span>
        </div>
      </div>
      <h2>Your courses</h2>
      <div className="course-grid">
        {data.lessons.map((l) => {
          const p = data.progress.find((p) => p.lessonId === l.id)!;
          return (
            <article
              className={`course-card ${l.course === 'English' ? 'english' : 'cyber'}`}
              key={l.id}
            >
              <span className="course-symbol" aria-hidden="true">
                {l.course === 'English' ? 'Aa' : '⌘'}
              </span>
              <span className="eyebrow">{l.course} · 1 available lesson</span>
              <h3>{l.title}</h3>
              <p>{l.summary}</p>
              <div className="tags">
                <span>{l.difficulty} difficulty</span>
                <span>{l.minutes} min</span>
                <span>Recommended #{l.order}</span>
              </div>
              <progress
                aria-label={`${l.course} progress`}
                value={satisfied(l, p)}
                max={l.tasks.length}
              />
              <p className="muted">
                {satisfied(l, p)}/{l.tasks.length} activities ·{' '}
                {p.completedAt
                  ? 'Completed'
                  : p.updatedAt
                    ? 'In progress'
                    : 'Ready to start'}
              </p>
              <a href={`#/lesson/${l.id}`}>
                {p.completedAt
                  ? 'Revisit lesson'
                  : p.updatedAt
                    ? 'Resume lesson'
                    : 'Open lesson'}{' '}
                →
              </a>
            </article>
          );
        })}
      </div>
      <aside className="local-note">
        <strong>One installation, one learner.</strong> Your desktop and phone
        share this profile. Anyone with access to this local app can read and
        change its progress. Core study uses no external services.
      </aside>
    </>
  );
}
function Review({
  data,
  onChange,
}: {
  data: Snapshot;
  onChange: (p: Progress) => void;
}) {
  const [selected, setSelected] = useState(0);
  const flush = useRef<(() => Promise<boolean>) | null>(null);
  const registerFlush = useCallback(
    (callback: (() => Promise<boolean>) | null) => {
      flush.current = callback;
    },
    [],
  );
  async function changeReview(index: number) {
    if (!flush.current || (await flush.current())) setSelected(index);
  }
  const mistakes = data.lessons.flatMap((l) =>
    l.tasks
      .filter(
        (t) =>
          t.kind === 'exact' &&
          (data.progress.find((p) => p.lessonId === l.id)?.tasks[t.id]
            ?.mistakes ?? 0) > 0,
      )
      .map((t) => ({ lesson: l, task: t })),
  );
  return (
    <>
      <span className="eyebrow">Learn from your attempts</span>
      <h1>Mistake review</h1>
      <p>
        Retry precise answers you missed. Corrected items remain as a record;
        scheduling comes in the next milestone.
      </p>
      {!mistakes.length ? (
        <div className="empty">
          No mistakes to review yet. Incorrect checked answers will appear here.
        </div>
      ) : (
        <>
          <label htmlFor="review-activity">Review activity</label>
          <select
            id="review-activity"
            value={selected}
            onChange={(e) => void changeReview(Number(e.target.value))}
          >
            {mistakes.map(({ lesson, task }, index) => (
              <option key={`${lesson.id}-${task.id}`} value={index}>
                {lesson.course}: {task.id}
              </option>
            ))}
          </select>
          <ReviewItem
            key={`${mistakes[selected].lesson.id}-${mistakes[selected].task.id}`}
            lesson={mistakes[selected].lesson}
            taskId={mistakes[selected].task.id}
            progress={data.progress.find(
              (p) => p.lessonId === mistakes[selected].lesson.id,
            )!}
            onChange={onChange}
            registerFlush={registerFlush}
          />
        </>
      )}
    </>
  );
}
function ReviewItem({
  lesson,
  taskId,
  progress,
  onChange,
  registerFlush,
}: {
  lesson: Lesson;
  taskId: string;
  registerFlush: (callback: (() => Promise<boolean>) | null) => void;
  progress: Progress;
  onChange: (p: Progress) => void;
}) {
  const { enqueue, status, error, retry } = useProgress(progress, onChange);
  return (
    <article>
      <h2>
        {lesson.course} · {lesson.title}
      </h2>
      <p role="status">{status}</p>
      {error && (
        <p role="alert">
          {error}
          <button onClick={retry}>Enable retry</button>
        </p>
      )}
      <p className="muted">
        Last incorrect answer:{' '}
        <code>
          {[...(progress.tasks[taskId]?.attemptLog ?? [])]
            .reverse()
            .find((attempt) => !attempt.correct)?.answer ??
            'Recorded in an earlier version; retry below.'}
        </code>
      </p>
      <TaskCard
        task={lesson.tasks.find((t) => t.id === taskId)!}
        state={progress.tasks[taskId]}
        registerFlush={registerFlush}
        enqueue={enqueue}
      />
    </article>
  );
}
export function App() {
  const [data, setData] = useState<Snapshot>();
  const [error, setError] = useState('');
  const [route, setRoute] = useState(location.hash);
  useEffect(() => {
    let active = true;
    load()
      .then((d) => {
        if (active) setData(d);
      })
      .catch((e) => {
        if (active) setError(e instanceof Error ? e.message : 'Load failed.');
      });
    const navigate = () => setRoute(location.hash);
    window.addEventListener('hashchange', navigate);
    return () => {
      active = false;
      window.removeEventListener('hashchange', navigate);
    };
  }, []);
  const update = useCallback(
    (progress: Progress) =>
      setData((d) =>
        d
          ? {
              ...d,
              progress: d.progress.map((p) =>
                p.lessonId === progress.lessonId ? progress : p,
              ),
            }
          : d,
      ),
    [],
  );
  const lesson = data?.lessons.find((l) => route === `#/lesson/${l.id}`);
  return (
    <>
      <a
        className="skip"
        href="#main"
        onClick={(e) => {
          e.preventDefault();
          document.getElementById('main')?.focus();
        }}
      >
        Skip to content
      </a>
      <header>
        <a className="brand" href="#/">
          Study<span>Lab</span>
          <small>ENGLISH + CYBERSECURITY</small>
        </a>
        <nav aria-label="Main">
          <a
            aria-current={!lesson && route !== '#/review' ? 'page' : undefined}
            href="#/"
          >
            Dashboard
          </a>
          <a
            aria-current={route === '#/review' ? 'page' : undefined}
            href="#/review"
          >
            Mistake review
          </a>
        </nav>
        <span className="local-badge">● Local workspace</span>
      </header>
      <main id="main" tabIndex={-1}>
        {error ? (
          <div role="alert">
            <h1>Could not load Study Lab</h1>
            <p>{error}</p>
            <button onClick={() => location.reload()}>Retry loading</button>
          </div>
        ) : !data ? (
          <p role="status">Loading your lessons and progress…</p>
        ) : lesson ? (
          <LessonView
            key={`${lesson.id}-${route}`}
            lesson={lesson}
            progress={data.progress.find((p) => p.lessonId === lesson.id)!}
            onChange={update}
          />
        ) : route === '#/review' ? (
          <Review data={data} onChange={update} />
        ) : route === '' || route === '#/' ? (
          <Dashboard data={data} />
        ) : (
          <>
            <h1>Page not found</h1>
            <a href="#/">Back to dashboard</a>
          </>
        )}
      </main>
      <footer>
        Study Lab · small steps, useful skills{' '}
        <span>Local learner · Milestone 1</span>
      </footer>
    </>
  );
}
