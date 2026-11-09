// Reuse lesson saving, checking and self-review rather than storing independent quiz answers
import { useCallback, useEffect, useRef, useState } from 'react';
import type { Progress } from '../shared/schema.js';
import type { QuizSession } from '../server/quiz.js';
import { taskSatisfied } from '../shared/domain.js';
import { load, request, type Snapshot } from './api';
import { useProgress } from './use-progress';
import { NewsUpdate } from './News';
import { TaskCard } from './TaskCard';

// Display stable selection references while reusing each lesson question and its saved progress
export function DailyQuiz({
  data,
  onChange,
  onSnapshot,
}: {
  onSnapshot?: (snapshot: Snapshot) => void;
  data: Snapshot;
  onChange: (progress: Progress) => void;
}) {
  // Keep the selection separate from the shared saved answer and current draft flush
  const [session, setSession] = useState<QuizSession>();
  const [course, setCourse] = useState<'English' | 'Cybersecurity'>('English');
  const [indices, setIndices] = useState({ English: 0, Cybersecurity: 0 });
  const changing = useRef(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const flush = useRef<(() => Promise<boolean>) | null>(null);
  const attach = useCallback((callback: (() => Promise<boolean>) | null) => {
    flush.current = callback;
  }, []);

  // Load the saved selection without requesting an implicit refresh
  useEffect(() => {
    void request<QuizSession>('/api/quiz')
      .then(setSession)
      .catch((reason) => setError(String(reason)));
  }, []);

  // Use shared completion rules for refresh confirmation rather than treating every saved draft as finished
  const incomplete =
    session?.items.filter((item) => {
      const lesson = data.lessons.find((lesson) => lesson.id === item.lessonId);
      const task = lesson?.tasks.find((task) => task.id === item.taskId);
      const progress = data.progress.find(
        (progress) => progress.lessonId === item.lessonId,
      );
      return !task || !taskSatisfied(task, progress?.tasks[item.taskId]);
    }) ?? [];
  const allComplete = data.lessons.every((lesson) =>
    lesson.tasks.every((task) =>
      taskSatisfied(
        task,
        data.progress.find((progress) => progress.lessonId === lesson.id)
          ?.tasks[task.id],
      ),
    ),
  );

  // Flush the current card before replacing the selection; failures retain the draft and session
  async function refresh() {
    if (busy || changing.current || !session) return;
    changing.current = true;
    setBusy(true);
    try {
      if (flush.current && !(await flush.current())) {
        setError(
          'Save did not succeed — your session and draft remain unchanged',
        );
        return;
      }
      const next = await request<QuizSession>('/api/quiz/refresh', {
        revision: session.revision,
      });
      setSession(next);
      setIndices({ English: 0, Cybersecurity: 0 });
      dialog.current?.close();
    } catch (reason) {
      setError(String(reason));
    } finally {
      changing.current = false;
      setBusy(false);
    }
  }

  // Show confirmation before flushing so a newly edited completed answer is listed once its saved completion is invalidated
  async function confirmRefresh() {
    if (busy || changing.current || !session) return;
    if (!session.items.length) return refresh();
    dialog.current?.showModal();
    changing.current = true;
    setBusy(true);
    setError('');
    try {
      if (flush.current && !(await flush.current()))
        setError(
          'Save did not succeed — your session and draft remain unchanged',
        );
    } finally {
      changing.current = false;
      setBusy(false);
    }
  }

  // Group legacy references in place without generating new questions or rewriting their persisted selection
  const courses = ['English', 'Cybersecurity'] as const;
  const courseItems = (name: string) =>
    session?.items.filter(
      (item) =>
        data.lessons.find((lesson) => lesson.id === item.lessonId)?.course ===
        name,
    ) ?? [];
  const items = courseItems(course);
  const index = indices[course];
  const remaining = data.lessons
    .filter((lesson) => lesson.course === course)
    .flatMap((lesson) =>
      lesson.tasks.filter(
        (task) =>
          !taskSatisfied(
            task,
            data.progress.find((progress) => progress.lessonId === lesson.id)
              ?.tasks[task.id],
          ),
      ),
    );
  const minutes = items.reduce((sum, item) => sum + item.minutes, 0);
  const met = items.filter((item) => !incomplete.includes(item)).length;

  // Flush the mounted draft before changing a course or question, reserving navigation immediately to prevent overlap
  async function select(
    name: typeof course,
    question?: number,
    focusTab = false,
  ) {
    if (
      changing.current ||
      busy ||
      (name === course && (question === undefined || question === index))
    )
      return;
    changing.current = true;
    setBusy(true);
    try {
      if (flush.current && !(await flush.current())) {
        setError(
          'Save did not succeed — your tab, question and draft remain unchanged',
        );
        return;
      }
      setError('');
      setCourse(name);
      if (question !== undefined)
        setIndices((previous) => ({ ...previous, [name]: question }));
      if (focusTab)
        requestAnimationFrame(() =>
          document.getElementById('quiz-tab-' + name)?.focus(),
        );
    } finally {
      changing.current = false;
      setBusy(false);
    }
  }

  // Resolve stable catalogue identities and reject version mismatches before mounting the shared assessment controls
  const item = items[index];
  const lesson = data.lessons.find((lesson) => lesson.id === item?.lessonId);
  const task = lesson?.tasks.find((task) => task.id === item?.taskId);
  const progress = data.progress.find(
    (progress) => progress.lessonId === lesson?.id,
  );

  // Present explicit refresh confirmation, question navigation and shared lesson context
  return (
    <>
      <h1>Daily Quiz</h1>
      <NewsUpdate
        onUpdated={async () => {
          onSnapshot?.(await load());
        }}
      />
      <p>
        This selection stays until you explicitly Refresh — answers are shared
        with lessons
      </p>
      {error && <p role="alert">{error}</p>}
      {allComplete && (
        <h2>Congratulations! You Have Completed All Questions</h2>
      )}
      {session && session.policy !== 'course-7' && (
        <p>
          Existing selection grouped by course — use Refresh to apply the new
          seven-question course targets
        </p>
      )}
      <p>
        Aim: 2 Easy, 3 Medium and 2 Hard questions per course, about 60 minutes
        each — 120 minutes combined
      </p>
      <button disabled={busy || !session} onClick={() => void confirmRefresh()}>
        Refresh
      </button>

      {/* List unfinished work before an explicit selection replacement */}
      <dialog
        className="quiz-refresh-dialog"
        ref={dialog}
        aria-labelledby="quiz-refresh-title"
      >
        <h2 id="quiz-refresh-title">Refresh Quiz Selection?</h2>
        <p>Your answers and progress remain saved</p>
        {error && <p role="alert">{error}</p>}
        <ul>
          {incomplete.map((item) => {
            const lesson = data.lessons.find(
              (lesson) => lesson.id === item.lessonId,
            );
            return (
              <li key={item.lessonId + item.taskId}>
                {lesson?.course} — {lesson?.title} —{' '}
                {lesson?.tasks.find((task) => task.id === item.taskId)?.prompt}
              </li>
            );
          })}
        </ul>
        <button disabled={busy} onClick={() => void refresh()}>
          Still Refresh
        </button>
        <button disabled={busy} onClick={() => dialog.current?.close()}>
          Don’t Refresh
        </button>
      </dialog>

      {/* Accessible course tabs change only the view and preserve each course's selected question */}
      <div role="tablist" aria-label="Quiz Courses">
        {courses.map((name) => (
          <button
            id={'quiz-tab-' + name}
            key={name}
            role="tab"
            aria-selected={name === course}
            aria-controls={'quiz-panel-' + name}
            tabIndex={name === course ? 0 : -1}
            disabled={busy}
            onClick={() => void select(name)}
            onKeyDown={(event) => {
              if (
                !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)
              )
                return;
              event.preventDefault();
              const next =
                event.key === 'Home'
                  ? 'English'
                  : event.key === 'End'
                    ? 'Cybersecurity'
                    : name === 'English'
                      ? 'Cybersecurity'
                      : 'English';
              void select(next, undefined, true);
            }}
          >
            {name} — {courseItems(name).length} Questions
          </button>
        ))}
      </div>
      {courses
        .filter((name) => name !== course)
        .map((name) => (
          <section
            key={name}
            role="tabpanel"
            hidden
            id={'quiz-panel-' + name}
            aria-labelledby={'quiz-tab-' + name}
          />
        ))}
      <section
        role="tabpanel"
        id={'quiz-panel-' + course}
        aria-labelledby={'quiz-tab-' + course}
      >
        <p>
          {items.length} selected questions · About {minutes} minutes —{' '}
          {minutes < 60 ? 'shorter than' : minutes > 60 ? 'longer than' : 'at'}{' '}
          the 60-minute aim
        </p>
        <p>
          {['Easy', 'Medium', 'Hard']
            .map(
              (difficulty) =>
                `${difficulty}: ${items.filter((item) => item.difficulty === difficulty).length}`,
            )
            .join(' · ')}
        </p>
        <p>
          {met}/{items.length} selected question requirements met
        </p>
        {!remaining.length && <h2>All {course} Questions Completed</h2>}
        {remaining.length > 0 && items.length < 7 && (
          <p>
            This selection has fewer than seven questions — no completed work or
            filler has been added
          </p>
        )}
        {items.length > 0 &&
          (items.filter((item) => item.difficulty === 'Easy').length !== 2 ||
            items.filter((item) => item.difficulty === 'Medium').length !== 3 ||
            items.filter((item) => item.difficulty === 'Hard').length !==
              2) && (
            <p>
              Available incomplete work uses a different difficulty mix — nearby
              difficulties fill shortages within this course
            </p>
          )}
        <nav aria-label="Quiz Questions">
          {items.map((entry, i) => (
            <button
              key={entry.lessonId + entry.taskId}
              aria-current={i === index ? 'step' : undefined}
              disabled={busy}
              onClick={() => void select(course, i)}
            >
              {i + 1} · {entry.difficulty}
            </button>
          ))}
        </nav>
        {remaining.length > 0 &&
          item &&
          lesson &&
          task &&
          progress &&
          lesson.version === item.version && (
            <>
              <h2>{lesson.title}</h2>
              <details>
                <summary>Preparation And Evidence</summary>
                {lesson.teaching.map((section) => (
                  <section key={section.title}>
                    <h3>{section.title}</h3>
                    <p>{section.body}</p>
                  </section>
                ))}
                <pre>{lesson.material}</pre>
                {lesson.evidence && (
                  <a href={lesson.evidence}>Download Evidence</a>
                )}
              </details>
              <QuizQuestion
                key={lesson.id + task.id + session?.id}
                lesson={lesson}
                task={task}
                progress={progress}
                onChange={onChange}
                attach={attach}
              />
            </>
          )}
        {item && lesson?.version !== item.version && (
          <p role="alert">
            Content changed — saved work remains available in its lesson,
            Refresh to select current questions
          </p>
        )}
      </section>
    </>
  );
}

// Keep the same revision queue and task controls used inside a lesson
function QuizQuestion({
  lesson,
  task,
  progress,
  onChange,
  attach,
}: {
  lesson: Snapshot['lessons'][number];
  task: Snapshot['lessons'][number]['tasks'][number];
  progress: Progress;
  onChange: (progress: Progress) => void;
  attach: (callback: (() => Promise<boolean>) | null) => void;
}) {
  const { enqueue, status, error, retry, confirmed } = useProgress(
    progress,
    onChange,
  );
  return (
    <>
      <p role="status">{status}</p>
      {error && (
        <p role="alert">
          {error}
          <button onClick={retry}>Enable Retry</button>
        </p>
      )}
      <p>
        {taskSatisfied(task, progress.tasks[task.id])
          ? 'Question Requirements Met'
          : 'Question Incomplete'}
      </p>
      <TaskCard
        task={task}
        state={progress.tasks[task.id]}
        lesson={lesson}
        progress={progress}
        enqueue={enqueue}
        confirmed={confirmed}
        onProgress={onChange}
        registerFlush={attach}
      />
    </>
  );
}
