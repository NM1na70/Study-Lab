// Import persisted sessions and reuse the normal native checking controls
import { useCallback, useEffect, useRef, useState } from 'react';
import type { Lesson, Mutation } from '../shared/schema.js';
import type {
  ReviewSnapshot,
  ReviewSession,
  ReviewMutation,
} from '../shared/review.js';
import { request, type Snapshot } from './api';
import { TaskCard } from './TaskCard';

// Resume scheduled recall with its own revisioned drafts and outcomes
export function ReviewDue({
  lessons,
  onCount,
  onSnapshot,
  revisionKey,
}: {
  revisionKey?: string;
  lessons: Lesson[];
  onCount: (count: number) => void;
  onSnapshot: (snapshot: Snapshot) => void;
}) {
  // Keep server revisions and pending writes separate from the displayed session
  const [snapshot, setSnapshot] = useState<ReviewSnapshot>();
  const [session, setSession] = useState<ReviewSession>();
  const [course, setCourse] = useState('English');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const current = useRef<ReviewSession | undefined>(undefined);
  const queue = useRef(Promise.resolve());
  const failed = useRef(false);
  const flush = useRef<(() => Promise<boolean>) | null>(null);
  const attach = useCallback((callback: (() => Promise<boolean>) | null) => {
    flush.current = callback;
  }, []);

  // Reload due metadata when original lesson revisions change
  useEffect(() => {
    void request<ReviewSnapshot>('/api/reviews')
      .then(setSnapshot)
      .catch((reason) => setError(String(reason)));
  }, [revisionKey]);

  // Serialise review writes without touching original assessed lesson attempts
  const write = useCallback(
    (mutation: Omit<ReviewMutation, 'revision'>): Promise<boolean> => {
      let ok = false;
      const job = queue.current.then(async () => {
        if (failed.current || !current.current) return;
        try {
          const next = await request<ReviewSession>(
            '/api/reviews/' + current.current.id,
            { ...mutation, revision: current.current.revision },
          );
          current.current = next;
          setSession(next);
          ok = true;
          const reviews = await request<ReviewSnapshot>('/api/reviews');
          setSnapshot(reviews);
          onCount(reviews.count);
          if (['dismiss', 'undo'].includes(mutation.action))
            onSnapshot(await request<Snapshot>('/api/lessons'));
        } catch (reason) {
          failed.current = true;
          setError(
            reason instanceof Error
              ? reason.message
              : 'Could not save this review',
          );
        }
      });
      queue.current = job;
      return job.then(() => ok);
    },
    [onCount, onSnapshot],
  );

  // Adapt only supported task actions to the separate recall-session writer
  const enqueue = useCallback(
    (mutation: Omit<Mutation, 'revision'>) => {
      if (!['draft', 'check', 'hint', 'solution'].includes(mutation.action))
        return Promise.resolve(false);
      return write({
        action: mutation.action as 'draft' | 'check' | 'hint' | 'solution',
        answer: mutation.answer,
      });
    },
    [write],
  );

  // Following navigation from a disabled recorded card needs no further draft write
  const keepRecorded = useCallback(async () => true, []);

  // Ask the server to resume an unfinished session or select due concepts
  async function start() {
    setBusy(true);
    try {
      const next = await request<ReviewSession>('/api/reviews/start', {
        course,
      });
      current.current = next;
      setSession(next);
    } catch (reason) {
      setError(String(reason));
    } finally {
      setBusy(false);
    }
  }

  // Save the current recall draft before advancing, removing or finishing its session
  async function move(action: 'next' | 'skip' | 'finish' | 'dismiss' | 'undo') {
    setBusy(true);
    try {
      if (flush.current && !(await flush.current())) return;
      await write({ action });
    } finally {
      setBusy(false);
    }
  }

  // Resolve the current concept for display while server writes enforce content versions
  const item = session?.items[session.index];
  const schedule =
    item && snapshot?.due.find((schedule) => schedule.concept === item.concept);
  const task = lessons
    .flatMap((lesson) => lesson.tasks)
    .find((task) => task.reviewConcept === item?.concept);

  // Present due counts, recorded outcomes and explicit removal or undo without lesson completion claims
  return (
    <>
      <h1>Review Due</h1>
      <p>
        Short practice sessions use UTC times — missed days carry no penalty and
        review results do not change your original lesson attempts
      </p>
      {error && (
        <p role="alert">
          {error}{' '}
          <button
            onClick={() => {
              failed.current = false;
              setError('');
            }}
          >
            Enable Retry
          </button>
        </p>
      )}
      {session?.removed && !session.finishedAt && (
        <p role="status">
          Item removed from active review{' '}
          <button disabled={busy} onClick={() => void move('undo')}>
            Undo
          </button>
        </p>
      )}

      {/* Distinguish due selection, finished-session summaries and active recall controls */}
      {!session ? (
        <>
          <div className="actions">
            {['English', 'Cybersecurity'].map((name) => (
              <button
                aria-pressed={course === name}
                key={name}
                onClick={() => setCourse(name)}
              >
                {name} (
                {snapshot?.due.filter(
                  (schedule) =>
                    lessons.find((lesson) => lesson.id === schedule.lessonId)
                      ?.course === name,
                ).length ?? 0}
                )
              </button>
            ))}
          </div>
          <p>
            {snapshot?.due.some(
              (schedule) =>
                lessons.find((lesson) => lesson.id === schedule.lessonId)
                  ?.course === course,
            )
              ? 'Due Today'
              : 'No Reviews Due'}
          </p>
          <button
            disabled={
              busy ||
              (!snapshot?.due.some(
                (schedule) =>
                  lessons.find((lesson) => lesson.id === schedule.lessonId)
                    ?.course === course,
              ) &&
                !snapshot?.active.some((session) => session.course === course))
            }
            onClick={() => void start()}
          >
            Start Review
          </button>
        </>
      ) : session.finishedAt ? (
        <>
          <h2>Session Finished</h2>
          <p>
            {session.items.filter((item) => item.recorded).length} recorded
            results — skipped items remain due
          </p>
          <a className="button" href="#/">
            Back To Dashboard
          </a>
        </>
      ) : item && task ? (
        <>
          {item.assisted && (
            <p>
              Recent assistance is recorded — this attempt will receive an
              earlier retry
            </p>
          )}
          <p>
            Item {session.index + 1} Of {session.items.length} ·{' '}
            {schedule &&
            snapshot &&
            schedule.dueAt.slice(0, 10) < snapshot.now.slice(0, 10)
              ? 'Overdue'
              : 'Due Today'}
          </p>
          {item.recorded ? (
            <>
              <p>Recorded — Next Review: {item.nextDue} UTC</p>
              <fieldset disabled className="activity-fieldset">
                <TaskCard
                  key={item.concept}
                  task={task}
                  state={item.state}
                  enqueue={keepRecorded}
                />
              </fieldset>
            </>
          ) : (
            <TaskCard
              key={item.concept}
              task={task}
              state={item.state}
              enqueue={enqueue}
              registerFlush={attach}
            />
          )}
          <div className="actions">
            {item.recorded ? (
              <button disabled={busy} onClick={() => void move('next')}>
                Next Review
              </button>
            ) : (
              <button disabled={busy} onClick={() => void move('skip')}>
                Skip Item
              </button>
            )}
            <button
              className="secondary"
              disabled={busy}
              onClick={() => void move('dismiss')}
            >
              Remove
            </button>
            <button
              className="secondary"
              disabled={busy}
              onClick={() => void move('finish')}
            >
              Finish Session
            </button>
          </div>
        </>
      ) : (
        <>
          <p>All session items are recorded or skipped</p>
          <button onClick={() => void move('finish')}>Finish Session</button>
        </>
      )}
    </>
  );
}
