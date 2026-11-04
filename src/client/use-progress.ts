// Import React hooks, progress types, and the API save helper
import { useCallback, useEffect, useRef, useState } from 'react';
import type { Mutation, Progress } from '../shared/schema.js';
import { save } from './api';

// Queue progress writes and expose confirmed save status to the current page
export function useProgress(
  initial: Progress,
  onChange: (progress: Progress) => void,
) {
  // Track the last confirmed revision, queued work, and visible save feedback
  const current = useRef(initial);
  const queue = useRef<Promise<void>>(Promise.resolve());
  const failed = useRef(false);
  const pending = useRef(0);
  const [status, setStatus] = useState('Saved');
  const [error, setError] = useState('');

  // Accept a newer snapshot from the parent without replacing it with an older revision
  useEffect(() => {
    if (initial.revision > current.current.revision) current.current = initial;
  }, [initial]);

  // Send one mutation at a time using the revision confirmed by the preceding response
  const enqueue = useCallback(
    (mutation: Omit<Mutation, 'revision'>): Promise<boolean> => {
      pending.current++;
      setStatus('Saving…');
      let success = false;
      const job = queue.current
        .then(async () => {
          // Stop queued actions after a failure so later edits cannot silently use an uncertain revision
          if (failed.current) return;
          try {
            const result = await save(current.current.lessonId, {
              ...mutation,
              revision: current.current.revision,
            });
            current.current = result;
            onChange(result);
            success = true;
          } catch (reason) {
            failed.current = true;
            setError(reason instanceof Error ? reason.message : 'Save failed.');
          }
        })
        .finally(() => {
          pending.current--;
          setStatus(
            failed.current
              ? 'Save error'
              : pending.current
                ? 'Saving…'
                : 'Saved',
          );
        });

      // Keep the queue chained while returning this mutation's success to its caller
      queue.current = job;
      return job.then(() => success);
    },
    [onChange],
  );

  // Allow an explicit retry without discarding the answer still held by the task card
  const retry = () => {
    failed.current = false;
    setError('');
    setStatus('Unsaved — retry your answer or action');
  };

  // Let navigation decisions inspect confirmed work immediately after a successful draft flush
  return { enqueue, status, error, retry, confirmed: () => current.current };
}
