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
  const [index, setIndex] = useState(0);
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
    if (busy || !session) return;
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
      setIndex(0);
      dialog.current?.close();
    } catch (reason) {
      setError(String(reason));
    } finally {
      setBusy(false);
    }
  }

  // Resolve the selected version against the current catalogue before mounting its ordinary task card
  const item = session?.items[index];
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
      {allComplete ? (
        <h2>Congratulations! You Have Completed All Questions</h2>
      ) : (
        <p>
          {session?.items.length ?? 0} selected questions · About{' '}
          {session?.items.reduce((sum, item) => sum + item.minutes, 0) ?? 0}{' '}
          minutes — available work may be shorter than 90 minutes
        </p>
      )}
      <button
        disabled={busy || !session}
        onClick={() =>
          incomplete.length ? dialog.current?.showModal() : void refresh()
        }
      >
        Refresh
      </button>

      {/* List unfinished work before an explicit selection replacement */}
      <dialog
        className="quiz-refresh-dialog"
        ref={dialog}
        aria-labelledby="quiz-refresh-title"
      >
        <h2 id="quiz-refresh-title">Refresh Unfinished Quiz?</h2>
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
      <nav aria-label="Quiz Questions">
        {session?.items.map((entry, i) => (
          <button
            key={entry.lessonId + entry.taskId}
            aria-current={i === index ? 'step' : undefined}
            onClick={async () => {
              if (!flush.current || (await flush.current())) setIndex(i);
            }}
          >
            {i + 1} ·{' '}
            {
              data.lessons.find((lesson) => lesson.id === entry.lessonId)
                ?.course
            }{' '}
            · {entry.difficulty}
          </button>
        ))}
      </nav>
      {item &&
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
            <a href={'#/lesson/' + lesson.id}>Open Lesson</a>
          </>
        )}
      {item && lesson?.version !== item.version && (
        <p role="alert">
          Content changed — saved work remains available in its lesson, Refresh
          to select current questions
        </p>
      )}
      <p>
        <a href="#/review">Mistake Review</a> ·{' '}
        <a href="#/">Course Catalogue</a>
      </p>
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
