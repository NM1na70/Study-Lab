// Import shared assessment controls and queues for course-based review
import { useCallback, useRef, useState } from 'react';
import type { Lesson, Progress } from '../shared/schema.js';
import { activeReview, displayAnswer } from '../shared/domain.js';
import type { Snapshot } from './api';
import { useProgress } from './use-progress';
import { TaskCard } from './TaskCard';

// Filter review by course and save an open activity before changing the course
export function Review({
  data,
  onChange,
}: {
  data: Snapshot;
  onChange: (progress: Progress) => void;
}) {
  // Keep one course and one active draft selected while retaining independent saved histories
  const [course, setCourse] = useState('English');
  const flush = useRef<(() => Promise<boolean>) | null>(null);
  const registerFlush = useCallback(
    (callback: (() => Promise<boolean>) | null) => {
      flush.current = callback;
    },
    [],
  );
  return (
    <>
      <span className="eyebrow">Learn from your attempts</span>
      <h1>Mistake Review</h1>
      <p>
        Remove hides an item from active review and preserves its history — a
        new incorrect checked attempt brings it back
      </p>
      <div className="actions">
        {['English', 'Cybersecurity'].map((name) => (
          <button
            key={name}
            aria-pressed={name === course}
            onClick={async () => {
              if (!flush.current || (await flush.current())) setCourse(name);
            }}
          >
            {name} (
            {data.lessons
              .filter((lesson) => lesson.course === name)
              .reduce(
                (count, lesson) =>
                  count +
                  lesson.tasks.filter((task) =>
                    activeReview(
                      task,
                      data.progress.find(
                        (progress) => progress.lessonId === lesson.id,
                      )?.tasks[task.id],
                    ),
                  ).length,
                0,
              )}
            )
          </button>
        ))}
      </div>
      {data.lessons
        .filter((lesson) => lesson.course === course)
        .map((lesson) => (
          <CourseReview
            key={`${course}-${lesson.id}`}
            lesson={lesson}
            progress={data.progress.find(
              (progress) => progress.lessonId === lesson.id,
            )!}
            onChange={onChange}
            registerFlush={registerFlush}
          />
        ))}
    </>
  );
}

// Share one save queue between practice, dismissal and undo within the lesson
function CourseReview({
  lesson,
  progress,
  onChange,
  registerFlush,
}: {
  lesson: Lesson;
  progress: Progress;
  onChange: (progress: Progress) => void;
  registerFlush: (callback: (() => Promise<boolean>) | null) => void;
}) {
  // Route practice, removal and Undo through the same confirmed revision queue
  const { enqueue, status, error, retry, confirmed } = useProgress(
    progress,
    onChange,
  );
  const [selected, setSelected] = useState<string>();
  const [removed, setRemoved] = useState<string>();
  const [busy, setBusy] = useState(false);
  const flush = useRef<(() => Promise<boolean>) | null>(null);
  const attach = useCallback(
    (callback: (() => Promise<boolean>) | null) => {
      flush.current = callback;
      registerFlush(callback);
    },
    [registerFlush],
  );

  // Derive the active list from the persistent dismissal watermark
  const rows = lesson.tasks.filter((task) =>
    activeReview(task, progress.tasks[task.id]),
  );
  async function action(id: string, remove: boolean) {
    if (busy) return;
    setBusy(true);
    try {
      if (flush.current && !(await flush.current())) return;
      if (remove) {
        if (await enqueue({ action: 'dismissReview', taskId: id })) {
          setRemoved(id);
          if (selected === id) setSelected(undefined);
        }
      } else setSelected(id);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section>
      <h2>{lesson.title}</h2>
      <p role="status">{status}</p>
      {error && (
        <p role="alert">
          {error} <button onClick={retry}>Enable Retry</button>
        </p>
      )}
      {removed && (
        <p role="status">
          Item removed from active review{' '}
          <button
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                if (flush.current && !(await flush.current())) return;
                if (await enqueue({ action: 'restoreReview', taskId: removed }))
                  setRemoved(undefined);
              } finally {
                setBusy(false);
              }
            }}
          >
            Undo
          </button>
        </p>
      )}
      {!rows.length ? (
        <p className="empty">No active mistakes in {lesson.course}</p>
      ) : (
        <table className="review-table">
          <caption>Active {lesson.course} Mistakes</caption>
          <thead>
            <tr>
              {[
                'Lesson',
                'Question',
                'Last Incorrect Answer',
                'Status',
                'Actions',
              ].map((label) => (
                <th key={label} scope="col">
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((task) => {
              const state = confirmed().tasks[task.id];
              const wrong = [...(state.attemptLog ?? [])]
                .reverse()
                .find((attempt) => !attempt.correct);
              return (
                <tr key={task.id}>
                  <td data-label="Lesson">{lesson.title}</td>
                  <th scope="row" data-label="Question">
                    {task.prompt}
                  </th>
                  <td data-label="Last Incorrect Answer">
                    <pre>
                      {wrong
                        ? displayAnswer(task, wrong.answer)
                        : 'Recorded in an earlier version'}
                    </pre>
                  </td>
                  <td data-label="Status">
                    {state.correct
                      ? task.kind === 'report' && !state.reviewed
                        ? 'Facts Correct — Self-Review Needed'
                        : 'Corrected — Available For Practice'
                      : 'Needs Review'}
                  </td>
                  <td data-label="Actions">
                    <button
                      disabled={busy}
                      onClick={() => void action(task.id, false)}
                    >
                      Review
                    </button>{' '}
                    <button
                      disabled={busy}
                      className="secondary"
                      onClick={() => void action(task.id, true)}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
      {selected && (
        <TaskCard
          key={selected}
          task={lesson.tasks.find((task) => task.id === selected)!}
          state={progress.tasks[selected]}
          enqueue={enqueue}
          lesson={lesson}
          progress={progress}
          confirmed={confirmed}
          onRetry={retry}
          registerFlush={attach}
        />
      )}
    </section>
  );
}
