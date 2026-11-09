// Import page hooks, lesson contracts, progress rules, and shared study components
import { useCallback, useEffect, useRef, useState } from 'react';
import type { Lesson, Progress } from '../shared/schema.js';
import {
  assisted,
  remainingTasks,
  satisfied,
  taskSatisfied,
} from '../shared/domain.js';
import { load, type Snapshot } from './api';
import { useProgress } from './use-progress';
import { TaskCard } from './TaskCard';
import { AiOwnerProvider, AiSettings } from './Ai';
import { ReviewDue } from './ReviewDue';
import { DefenceLab } from './Lab';
import { DailyQuiz } from './DailyQuiz';
import { Review } from './Review';

// Describe the bundled decoded evidence used by the browser review table
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

// Load and display the local evidence summary behind an explicit spoiler disclosure
function EvidenceSummary() {
  // Retain decoded evidence and load errors separately from learner assessment state
  const [data, setData] = useState<Evidence>();
  const [error, setError] = useState('');

  // Ignore late fetch results after the evidence panel has unmounted
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

  // Show loading or error feedback before rendering the decoded packet table
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

// Coordinate lesson navigation, saved progress, and completion around the current activity
function LessonView({
  lesson,
  progress,
  onChange,
}: {
  lesson: Lesson;
  progress: Progress;
  onChange: (p: Progress) => void;
}) {
  // Share one saving queue and retain the current card's save callback during navigation
  const { enqueue, status, error, retry, confirmed } = useProgress(
    progress,
    onChange,
  );
  const [finishing, setFinishing] = useState(false);
  const [navigating, setNavigating] = useState(false);
  const navigationPending = useRef(false);
  const focusStep = useRef<number | null>(null);
  const flush = useRef<(() => Promise<boolean>) | null>(null);
  const registerFlush = useCallback((f: (() => Promise<boolean>) | null) => {
    flush.current = f;
  }, []);

  const dialog = useRef<HTMLDialogElement>(null);
  const back = useRef<HTMLButtonElement>(null);
  const [remaining, setRemaining] = useState<string[]>([]);

  // Flush before leaving and decide against confirmed state rather than a pending render
  async function dashboard() {
    if (flush.current && !(await flush.current())) return;
    if (confirmed().completedAt) location.hash = '#/';
    else {
      setRemaining([]);
      dialog.current?.showModal();
    }
  }
  async function leave(completeNow: boolean) {
    setFinishing(true);
    try {
      if (flush.current && !(await flush.current())) return;
      if (completeNow) {
        const unfinished = remainingTasks(lesson, confirmed());
        if (unfinished.length) {
          setRemaining(unfinished.map((task) => task.id));
          return;
        }
        if (!(await enqueue({ action: 'complete' }))) return;
      }
      location.hash = '#/';
    } finally {
      setFinishing(false);
    }
  }

  // Reserve step zero for teaching and map numbered activity steps onto the task list
  const step = progress.step;
  const task = lesson.tasks[step - 1];

  // Lock navigation immediately so delayed saves cannot race another route selection
  async function changeStep(value: number) {
    if (navigationPending.current || value === confirmed().step) return;
    navigationPending.current = true;
    setNavigating(true);
    try {
      if (flush.current && !(await flush.current())) return;
      focusStep.current = value;
      if (!(await enqueue({ action: 'step', step: value })))
        focusStep.current = null;
    } finally {
      navigationPending.current = false;
      setNavigating(false);
    }
  }

  // Focus only the successfully opened section after React has rendered its heading
  useEffect(() => {
    if (navigating || focusStep.current === null || focusStep.current !== step)
      return;
    const heading = document.getElementById(
      step === 0 ? 'learn-heading' : `task-${lesson.tasks[step - 1]?.id}`,
    );
    heading?.focus({ preventScroll: true });
    heading?.scrollIntoView({ block: 'start' });
    focusStep.current = null;
  }, [navigating, step, lesson]);

  // Save pending edits before asking the server to enforce the completion requirements
  async function complete() {
    setFinishing(true);
    try {
      if (!flush.current || (await flush.current()))
        await enqueue({ action: 'complete' });
    } finally {
      setFinishing(false);
    }
  }

  // Display confirmed progress, the lesson route, and either teaching or the current task
  return (
    <>
      <div className="lesson-heading">
        <div>
          <span className="eyebrow">
            {lesson.course} · {lesson.difficulty} · {lesson.minutes} minutes
          </span>
          <h1>{lesson.title}</h1>
          {lesson.id === 'cyber-endpoint-correlation' && (
            <a href="#/lab">Open Simulation Defence</a>
          )}
        </div>
        <span className={`save-state ${error ? 'error' : ''}`} role="status">
          {status}
        </span>
      </div>
      {error && (
        <div className="feedback retry" role="alert">
          {error} Your draft stays on this page — select{' '}
          <button onClick={retry}>Enable Retry</button> then try saving or
          navigating again For a conflict, copy unsaved text before reloading
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
        Completion: correct every precise answer and{' '}
        {lesson.tasks.some((task) => task.kind === 'report')
          ? 'check the report facts and explicitly self-review its reasoning'
          : 'explicitly self-review the writing activity'}{' '}
        {progress.completedAt
          ? `Completed ${new Date(progress.completedAt).toLocaleDateString('en-AU')}.`
          : 'Not completed yet.'}{' '}
        {assisted(progress)
          ? 'Hints or examples used — assistance remains recorded'
          : ''}
      </p>

      {/* Keep all activities accessible while showing the current position and saved work */}
      <div className="study-layout">
        <aside className="study-map">
          <h2>Lesson route</h2>
          <nav aria-label="Lesson Route">
            <ol>
              <li className={step === 0 ? 'current' : ''}>
                <button
                  className="route-item"
                  aria-current={step === 0 ? 'step' : undefined}
                  disabled={navigating}
                  onClick={() => void changeStep(0)}
                >
                  Learn &amp; Prepare
                </button>
              </li>
              {lesson.tasks.map((activity, index) => (
                <li
                  key={activity.id}
                  className={step === index + 1 ? 'current' : ''}
                >
                  <button
                    className="route-item"
                    title={activity.prompt}
                    aria-current={step === index + 1 ? 'step' : undefined}
                    disabled={navigating}
                    onClick={() => void changeStep(index + 1)}
                  >
                    {index + 1}.{' '}
                    {activity.stage[0].toUpperCase() + activity.stage.slice(1)}
                    {taskSatisfied(activity, progress.tasks[activity.id]) && (
                      <span aria-label="Requirements Met"> ✓</span>
                    )}
                  </button>
                </li>
              ))}
            </ol>
          </nav>
        </aside>
        <div className="study-content" aria-busy={navigating}>
          {lesson.material && (
            <details className="study-material">
              <summary>Study Materials — Original Or Synthetic</summary>
              <pre>{lesson.material}</pre>
              {lesson.resources.map((resource) => (
                <p key={resource.url}>
                  <a href={resource.url} download>
                    {resource.label}
                  </a>
                </p>
              ))}
              {lesson.evidence && (
                <a href={lesson.evidence} download>
                  Download Evidence
                </a>
              )}
            </details>
          )}
          {step === 0 ? (
            <>
              <h2 id="learn-heading" tabIndex={-1}>
                Learn &amp; Prepare
              </h2>
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
                    {lesson.evidenceKind === 'pcap'
                      ? 'Download Synthetic PCAP · 1.4 KB'
                      : 'Download Synthetic Evidence'}
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
                Start Activities →
              </button>
            </>
          ) : task ? (
            <fieldset disabled={navigating} className="activity-fieldset">
              <TaskCard
                key={task.id}
                task={task}
                state={progress.tasks[task.id]}
                enqueue={enqueue}
                lesson={lesson}
                progress={progress}
                confirmed={confirmed}
                onRetry={retry}
                onProgress={onChange}
                registerFlush={registerFlush}
                onNext={
                  step < lesson.tasks.length
                    ? () => changeStep(step + 1)
                    : undefined
                }
              />
            </fieldset>
          ) : null}
          {lesson.evidence && lesson.evidenceKind === 'pcap' && (
            <EvidenceSummary />
          )}

          {/* Keep completion requirements and source attribution available from every activity */}
          <section className="finish">
            <h2>Finish This Lesson</h2>
            <p>
              {progress.completedAt
                ? 'Your completion is saved. You can revisit any activity. Editing an assessed answer reopens the lesson.'
                : 'You can retry as often as needed. Reading a solution alone does not complete an activity.'}
            </p>
            <div className="actions">
              <button
                disabled={
                  finishing ||
                  satisfied(lesson, progress) !== lesson.tasks.length ||
                  !!progress.completedAt
                }
                onClick={() => void complete()}
              >
                {progress.completedAt
                  ? 'Lesson Completed'
                  : 'Mark Lesson Complete'}
              </button>
              <button
                ref={back}
                disabled={finishing}
                className="secondary"
                onClick={() => void dashboard()}
              >
                Back To Dashboard
              </button>
            </div>
            {!!progress.completionHistory?.length && (
              <p>
                Earlier completion records are preserved
                {!progress.completedAt &&
                  ' — reopened activities need their own checks'}
              </p>
            )}
            <dialog
              ref={dialog}
              aria-labelledby="completion-prompt"
              onClose={() => back.current?.focus()}
            >
              <h2 id="completion-prompt">
                This lesson has not been marked as completed — would you like to
                mark it now?
              </h2>
              <div className="actions">
                <button
                  autoFocus
                  disabled={finishing}
                  onClick={() => void leave(true)}
                >
                  Mark It As Completed
                </button>
                <button
                  disabled={finishing}
                  className="secondary"
                  onClick={() => void leave(false)}
                >
                  Not Completed Yet
                </button>
              </div>
              {error && (
                <p role="alert">
                  {error} <button onClick={retry}>Enable Retry</button>
                </p>
              )}
              {!!remaining.length && (
                <div role="alert">
                  <p>
                    Finish these activities, including factual checks and
                    required self-review
                  </p>
                  <ul>
                    {remaining.map((id) => (
                      <li key={id}>
                        <button
                          className="text-button"
                          onClick={() => {
                            dialog.current?.close();
                            void changeStep(
                              lesson.tasks.findIndex((task) => task.id === id) +
                                1,
                            );
                          }}
                        >
                          Return To Activity{' '}
                          {lesson.tasks.findIndex((task) => task.id === id) + 1}
                        </button>{' '}
                        {lesson.tasks.find((task) => task.id === id)?.prompt}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </dialog>
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

// Derive course progress and the next study destination from persisted learner state
function Dashboard({ data }: { data: Snapshot }) {
  // Keep catalogue filters local while deriving counts from saved lesson state
  const [course, setCourse] = useState('All');
  const [topic, setTopic] = useState('All');
  const [completion, setCompletion] = useState('All');
  const visible = data.lessons
    .filter(
      (lesson) =>
        (course === 'All' || lesson.course === course) &&
        (topic === 'All' || lesson.topics.includes(topic)) &&
        (completion === 'All' ||
          (completion === 'Completed') ===
            !!data.progress.find((progress) => progress.lessonId === lesson.id)
              ?.completedAt),
    )
    .sort((a, b) => a.course.localeCompare(b.course) || a.order - b.order);
  const completed = data.progress.filter((p) => p.completedAt).length;

  // Resume the most recently updated unfinished lesson, then fall back to the first unfinished one
  const recent = [...data.progress]
    .filter((p) => p.updatedAt && !p.completedAt)
    .sort((a, b) => (b.updatedAt ?? '').localeCompare(a.updatedAt ?? ''))[0];
  const next =
    recent?.lessonId ??
    data.lessons.find(
      (l) => !data.progress.find((p) => p.lessonId === l.id)?.completedAt,
    )?.id;

  // Render the filtered lesson catalogue with actual counts and the shared-profile explanation
  return (
    <>
      <span className="eyebrow">Your Local Learning Workspace</span>
      <div className="hero">
        <div>
          <h1>Your Courses</h1>
          <div className="catalogue-filters">
            <div>
              <label htmlFor="catalogue-course">Course</label>
              <select
                id="catalogue-course"
                value={course}
                onChange={(event) => {
                  setCourse(event.target.value);
                  setTopic('All');
                }}
              >
                {['All', 'English', 'Cybersecurity'].map((name) => (
                  <option key={name}>{name}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="catalogue-topic">Topic</label>
              <select
                id="catalogue-topic"
                value={topic}
                onChange={(event) => setTopic(event.target.value)}
              >
                {[
                  'All',
                  ...new Set(
                    data.lessons
                      .filter(
                        (lesson) =>
                          course === 'All' || lesson.course === course,
                      )
                      .flatMap((lesson) => lesson.topics),
                  ),
                ].map((name) => (
                  <option key={name}>{name}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="catalogue-completion">Completion</label>
              <select
                id="catalogue-completion"
                value={completion}
                onChange={(event) => setCompletion(event.target.value)}
              >
                {['All', 'Completed', 'Not Completed'].map((name) => (
                  <option key={name}>{name}</option>
                ))}
              </select>
            </div>
          </div>
          {next ? (
            <a className="button" href={`#/lesson/${next}`}>
              Continue Studying →
            </a>
          ) : (
            <p>
              All lessons completed — revisit a lesson or review your learning
            </p>
          )}
        </div>
        <div className="stats">
          <strong>
            {completed}
            <span>/ {data.lessons.length}</span>
          </strong>
          <p>lessons completed</p>
          <span className="tag">No Accounts · No AI Required</span>
        </div>
      </div>

      <p>
        {visible.length} lessons shown — recommended order, with all activities
        unlocked
      </p>
      <div className="course-grid">
        {visible.map((l) => {
          const p = data.progress.find((p) => p.lessonId === l.id)!;
          return (
            <article
              className={`course-card ${l.course === 'English' ? 'english' : 'cyber'}`}
              key={l.id}
            >
              <span className="course-symbol" aria-hidden="true">
                {l.course === 'English' ? 'Aa' : '⌘'}
              </span>
              <span className="eyebrow">
                {l.course} ·{' '}
                {
                  data.lessons.filter((lesson) => lesson.course === l.course)
                    .length
                }{' '}
                available lessons
              </span>
              <h2>{l.title}</h2>
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
                  ? 'Revisit Lesson'
                  : p.updatedAt
                    ? 'Resume Lesson'
                    : 'Open Lesson'}{' '}
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

// Route the shared learner snapshot to study, combined review and optional owner pages
function StudyApp() {
  // Keep loading feedback and the hash route independent from saved lesson data
  const [data, setData] = useState<Snapshot>();
  const [error, setError] = useState('');
  const [route, setRoute] = useState(location.hash);

  // Load once, follow browser hash navigation, and ignore late results after the app unmounts
  useEffect(() => {
    let active = true;
    load()
      .then((d) => {
        if (active) setData(d);
      })
      .catch((e) => {
        if (active) setError(e instanceof Error ? e.message : 'Load failed.');
      });
    const navigate = () => {
      if (location.hash === '#/due') {
        location.replace('#/review');
        return;
      }
      setRoute(location.hash);
    };
    navigate();
    window.addEventListener('hashchange', navigate);
    return () => {
      active = false;
      window.removeEventListener('hashchange', navigate);
    };
  }, []);

  // Replace only the lesson whose confirmed progress changed
  const update = useCallback(
    (progress: Progress) =>
      setData((d) =>
        d
          ? {
              ...d,
              dueCount: progress.reviewDueCount ?? d.dueCount,
              progress: d.progress.map((p) =>
                p.lessonId === progress.lessonId ? progress : p,
              ),
            }
          : d,
      ),
    [],
  );

  const updateDue = useCallback(
    (count: number) =>
      setData((data) => (data ? { ...data, dueCount: count } : data)),
    [],
  );

  // Resolve lesson routes and render navigation, accessible content, and loading or error states
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
        Skip To Content
      </a>
      <header>
        <a className="brand" href="#/">
          StudyLab
        </a>
        <nav aria-label="Main">
          <a
            aria-current={route === '' || route === '#/' ? 'page' : undefined}
            href="#/"
          >
            Dashboard
          </a>
          <a
            href="#/quiz"
            aria-current={route === '#/quiz' ? 'page' : undefined}
          >
            Daily Quiz
          </a>
          <a
            href="#/review"
            aria-current={
              ['#/review', '#/due'].includes(route) ? 'page' : undefined
            }
          >
            Mistake Review
          </a>
          <a href="#/ai" aria-current={route === '#/ai' ? 'page' : undefined}>
            AI Settings
          </a>
        </nav>
        <span className="local-badge">● Local workspace</span>
      </header>
      <main id="main" tabIndex={-1}>
        {error ? (
          <div role="alert">
            <h1>Could not load Study Lab</h1>
            <p>{error}</p>
            <button onClick={() => location.reload()}>Retry Loading</button>
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
        ) : route === '#/ai' ? (
          <AiSettings />
        ) : route === '#/lab' ? (
          <DefenceLab
            progress={data.progress.find(
              (progress) => progress.lessonId === 'cyber-endpoint-correlation',
            )}
            onProgress={update}
          />
        ) : route === '#/quiz' ? (
          <DailyQuiz data={data} onChange={update} onSnapshot={setData} />
        ) : ['#/due', '#/review'].includes(route) ? (
          <>
            <section id="review-due" aria-label="Scheduled Review">
              <ReviewDue
                lessons={data.lessons}
                onCount={updateDue}
                revisionKey={data.progress
                  .map((progress) => progress.revision)
                  .join(':')}
                onSnapshot={setData}
              />
            </section>
            <section id="mistake-review" aria-label="Recorded Mistakes">
              <Review data={data} onChange={update} />
            </section>
          </>
        ) : route === '' || route === '#/' ? (
          <Dashboard data={data} />
        ) : (
          <>
            <h1>Page not found</h1>
            <a href="#/">Back To Dashboard</a>
          </>
        )}
      </main>
      <footer>2026 | Study Lab </footer>
    </>
  );
}

// Share only a transient owner capability across the local UI
export function App() {
  return (
    <AiOwnerProvider>
      <StudyApp />
    </AiOwnerProvider>
  );
}
