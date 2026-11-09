// Expose only fixed model operations through the same owner capability boundary as paid feedback
import { useEffect, useState } from 'react';
import type { Progress } from '../shared/schema.js';
import { labObjectives, type LabState } from '../shared/lab.js';

// Display the persisted model and request owner-authorised actions from the server
export function DefenceLab({
  progress,
  onProgress,
}: { progress?: Progress; onProgress?: (progress: Progress) => void } = {}) {
  // Hold owner input, displayed state and operation feedback only for this mounted view
  const [token, setToken] = useState('');
  const [state, setState] = useState<LabState>();
  const [past, setPast] = useState<{
    runs: LabState[];
    results: { checkedAt: string; verified: boolean; assisted: boolean }[];
  }>();
  const [command, setCommand] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  // Send a revisioned model operation and retain displayed state when it fails
  async function action(action: string) {
    if (busy) return;
    setBusy(true);
    try {
      const response = await fetch('/api/lab', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Study-Owner': token },
        body: JSON.stringify({
          revision: state?.revision ?? 0,
          action,
          command: action === 'command' ? command : '',
        }),
      });
      const result = await response.json();
      if (!response.ok) throw Error(result.error);
      setState(result);
      setCommand('');
      setError('');
    } catch (reason) {
      setError(String(reason));
    } finally {
      setBusy(false);
    }
  }

  // Load existing state when owner input changes without implicitly starting the model
  useEffect(() => {
    if (!token) return;
    void fetch('/api/lab', { headers: { 'X-Study-Owner': token } }).then(
      async (response) => {
        if (response.ok) setState(await response.json());
      },
    );
  }, [token]);

  // Request clock ticks only while the displayed model is running and release the timer on cleanup
  useEffect(() => {
    if (!state?.running) return;
    const timer = setInterval(() => void action('tick'), 1000);
    return () => clearInterval(timer);
  });

  // Keep model limitations, containment state and retained debriefs visible beside the controls
  return (
    <>
      <h1>Simulation Defence</h1>
      <p>
        Modelled environment — this is not an operating-system shell, virtual
        machine or actual network
      </p>
      <p>
        Authorised scope: one fictional endpoint, test account and portal —
        contain the probe while keeping the portal available — after the
        outbound event, collect ps, ss, accounts and journalctl evidence before
        verifying
      </p>
      <p>
        Desktop recommended — other course questions remain available on phones
      </p>
      <label>
        Owner Token
        <input
          type="password"
          autoComplete="off"
          value={token}
          onChange={(event) => setToken(event.target.value)}
        />
      </label>
      <p>
        The direct localhost owner capability is required to start, reset and
        operate this model
      </p>
      {error && <p role="alert">{error}</p>}
      <p>
        Scenario time: {Math.floor(state?.elapsed ?? 0)} seconds ·{' '}
        {state?.running ? 'Running' : 'Paused'}
      </p>
      <div className="actions">
        {['start', 'pause', 'resume', 'reset', 'help'].map((name) => (
          <button
            key={name}
            disabled={busy || !token}
            onClick={() => void action(name)}
          >
            {name[0].toUpperCase() + name.slice(1)}
          </button>
        ))}
      </div>
      <h2>Model Terminal</h2>
      <p>
        Supported tools inspect and change persistent model state — enter help
        for the fixed command grammar
      </p>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void action('command');
        }}
      >
        <label>
          Model Command
          <input
            value={command}
            maxLength={100}
            onChange={(event) => setCommand(event.target.value)}
          />
        </label>
        <button disabled={busy || !state?.running}>Run Command</button>
      </form>
      <h2>Service And Containment</h2>
      <p>
        Portal:{' '}
        {state?.serviceAvailable === false ? 'Unavailable' : 'Available'} ·
        Network: {state?.blocked ? 'Contained' : 'Not Contained'} · Account:{' '}
        {state?.accountDisabled ? 'Disabled' : 'Enabled'} · Probe:{' '}
        {state?.processStopped ? 'Stopped' : 'Not Contained'}
      </p>

      {/* Submit only the lesson revision; the server derives the model result */}
      {progress && (
        <button
          disabled={busy || !token}
          onClick={async () => {
            setBusy(true);
            try {
              const response = await fetch('/api/lab/verify', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'X-Study-Owner': token,
                },
                body: JSON.stringify({ revision: progress.revision }),
              });
              const result = await response.json();
              if (!response.ok) throw Error(result.error);
              onProgress?.(result);
            } catch (reason) {
              setError(String(reason));
            } finally {
              setBusy(false);
            }
          }}
        >
          Verify Lab Question
        </button>
      )}
      <h2>Evidence And Debrief</h2>
      <p>
        {state && labObjectives(state).verified
          ? 'Model Objectives Verified — this does not establish real-world mastery'
          : 'Objectives Not Yet Verified'}
      </p>
      <p>{state?.assisted ? 'Assisted run' : 'No solution help recorded'}</p>
      <ol>
        {state?.history.map((entry, index) => (
          <li key={index}>
            {entry.at}s · {entry.action}
            <pre>{entry.output}</pre>
          </li>
        ))}
      </ol>
      <details>
        <summary>Earlier Runs And Checks</summary>
        <button
          disabled={!token || busy}
          onClick={async () => {
            try {
              const response = await fetch('/api/lab/history', {
                headers: { 'X-Study-Owner': token },
              });
              if (!response.ok)
                throw Error('Owner history access was not accepted');
              setPast(await response.json());
            } catch (reason) {
              setError(String(reason));
            }
          }}
        >
          Load Debrief History
        </button>
        {past?.results.map((result, index) => (
          <p key={index}>
            {result.checkedAt} —{' '}
            {result.verified ? 'Objectives Met' : 'Objectives Not Met'} —{' '}
            {result.assisted ? 'Assisted' : 'No Model Help'}
          </p>
        ))}
        {past?.runs.map((run, index) => (
          <details key={index}>
            <summary>
              Archived Run {index + 1} — {Math.floor(run.elapsed)} Seconds
            </summary>
            <pre>{JSON.stringify(run.history, null, 2)}</pre>
          </details>
        ))}
      </details>
      <a href="#/lesson/cyber-endpoint-correlation">
        Return To Endpoint Lesson
      </a>
    </>
  );
}
