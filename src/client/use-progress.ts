import { useCallback, useEffect, useRef, useState } from 'react';
import type { Mutation, Progress } from '../shared/schema.js';
import { save } from './api';
export function useProgress(
  initial: Progress,
  onChange: (progress: Progress) => void,
) {
  const current = useRef(initial);
  const queue = useRef<Promise<void>>(Promise.resolve());
  const failed = useRef(false);
  const pending = useRef(0);
  const [status, setStatus] = useState('Saved');
  const [error, setError] = useState('');
  useEffect(() => {
    if (initial.revision > current.current.revision) current.current = initial;
  }, [initial]);
  const enqueue = useCallback(
    (mutation: Omit<Mutation, 'revision'>): Promise<boolean> => {
      pending.current++;
      setStatus('Saving…');
      let success = false;
      const job = queue.current
        .then(async () => {
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
      // A failed write stops subsequent writes until the user explicitly retries.
      queue.current = job;
      return job.then(() => success);
    },
    [onChange],
  );
  const retry = () => {
    failed.current = false;
    setError('');
    setStatus('Unsaved — retry your answer or action');
  };
  return { enqueue, status, error, retry };
}
