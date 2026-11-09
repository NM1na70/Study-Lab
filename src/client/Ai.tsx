// Keep owner access in memory only and send credentials solely to the same-origin server
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { Progress } from '../shared/schema.js';

// Describe connection metadata and advisory feedback independently of lesson correctness
interface Status {
  available: boolean;
  connected: boolean;
  tested?: boolean;
  model?: string;
  usedToday?: number;
  dailyLimit?: number;
}
interface Feedback {
  strength: string;
  improvement: string;
  evidence: string;
  nextStep: string;
}

// Share the transient owner capability across in-app navigation without browser storage
const Owner = createContext({
  token: '',
  unlock: (token: string) => {
    void token;
  },
});
export function AiOwnerProvider({ children }: { children: ReactNode }) {
  const [token, unlock] = useState('');
  return <Owner.Provider value={{ token, unlock }}>{children}</Owner.Provider>;
}

// Send explicit owner operations to the same-origin API and surface its safe error text
async function aiRequest<T>(
  path: string,
  token: string,
  body?: unknown,
  signal?: AbortSignal,
): Promise<T> {
  const response = await fetch('/api/ai/' + path, {
    method: body === undefined ? 'GET' : 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Study-Owner': token },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal,
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error ?? 'AI request failed');
  return result as T;
}

// Present optional connection controls without making a provider necessary for core study
export function AiSettings() {
  // Clear the API-key input immediately after submission and never use browser storage
  const { token, unlock } = useContext(Owner);
  const [owner, setOwner] = useState('');
  const [key, setKey] = useState('');
  const [status, setStatus] = useState<Status>();
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  // Reload connection metadata for the current owner capability
  useEffect(() => {
    void aiRequest<Status>('status', token)
      .then(setStatus)
      .catch((reason) => setMessage(String(reason)));
  }, [token]);

  // Clear the key input before awaiting the server and keep errors separate from study drafts
  async function action(action: 'connect' | 'test' | 'disconnect') {
    setBusy(true);
    setMessage('');
    const submitted = key;
    setKey('');
    try {
      setStatus(
        await aiRequest<Status>(
          action,
          token,
          action === 'connect' ? { key: submitted } : {},
        ),
      );
      setMessage(
        action === 'test'
          ? 'Connection tested'
          : action === 'connect'
            ? 'API key held in server memory'
            : 'Disconnected',
      );
    } catch (reason) {
      setMessage(
        reason instanceof Error ? reason.message : 'AI connection failed',
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <h1>AI Settings</h1>
      <p>
        Optional OpenAI feedback — all lessons, factual checks and self-review
        work without it
      </p>
      <p>
        API billing is separate from a ChatGPT subscription — each explicit
        feedback request sends your saved writing or reasoning, the question,
        rubric and necessary evidence context to OpenAI
      </p>
      <p>
        The key stays in server memory and is lost on restart — learner backups
        contain no API credentials
      </p>
      <p>
        Owner operations require a direct localhost connection and the server’s
        STUDY_OWNER_TOKEN — LAN clients cannot use these controls
      </p>
      {!status?.available && (
        <p>
          Owner AI access is disabled — see the owner setup in the operations
          guide
        </p>
      )}
      {!token ? (
        <>
          <label htmlFor="owner-token">Owner Token</label>
          <input
            id="owner-token"
            type="password"
            autoComplete="off"
            value={owner}
            onChange={(event) => setOwner(event.target.value)}
          />
          <button
            onClick={() => {
              unlock(owner);
              setOwner('');
            }}
          >
            Unlock AI Controls
          </button>
        </>
      ) : (
        <>
          <p>
            Connection Status:{' '}
            {status?.connected ? 'Connected' : 'Disconnected'} ·{' '}
            {status?.tested ? 'Tested' : 'Not Tested'}
          </p>
          <label htmlFor="openai-key">OpenAI API Key</label>
          <input
            id="openai-key"
            type="password"
            autoComplete="off"
            value={key}
            onChange={(event) => setKey(event.target.value)}
          />
          <div className="actions">
            <button
              disabled={busy || !key}
              onClick={() => void action('connect')}
            >
              Connect OpenAI API
            </button>
            <button
              disabled={busy || !status?.connected}
              onClick={() => void action('test')}
            >
              Test Connection
            </button>
            <button
              className="secondary"
              disabled={busy}
              onClick={() => void action('disconnect')}
            >
              Disconnect
            </button>
            <button className="text-button" onClick={() => unlock('')}>
              Lock AI Controls
            </button>
          </div>
          <p>
            Model: {status?.model} · Requests Used Today:{' '}
            {status?.usedToday ?? 0}/{status?.dailyLimit ?? 20}
          </p>
          <p>
            The application limits requests to three per minute, twenty per UTC
            day and one at a time — this is not a currency budget or a
            substitute for provider billing controls
          </p>
        </>
      )}
      {message && <p role="status">{message}</p>}
    </>
  );
}

// Request advice for saved writing while leaving deterministic checks and self-review independent
export function AiFeedback({
  lessonId,
  taskId,
  flush,
  onChange,
}: {
  lessonId: string;
  taskId: string;
  flush: () => Promise<boolean>;
  onChange?: (progress: Progress) => void;
}) {
  // Track explicit consent, advice and cancellable transport without storing credentials
  const { token } = useContext(Owner);
  const [consent, setConsent] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const controller = useRef<AbortController | null>(null);

  // Cancel browser transport when this feedback panel unmounts
  useEffect(() => () => controller.current?.abort(), []);

  // Save the latest draft before sending a new explicit consent-bearing request
  async function ask(mode: 'review' | 'explain') {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      if (!(await flush()))
        throw new Error('Save your draft successfully before using AI');
      controller.current = new AbortController();
      const result = await aiRequest<{
        feedback: Feedback;
        progress: Progress;
      }>(
        'feedback',
        token,
        { id: crypto.randomUUID(), lessonId, taskId, mode, consent },
        controller.current.signal,
      );
      setFeedback(result.feedback);
      onChange?.(result.progress);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'AI feedback failed');
    } finally {
      setBusy(false);
    }
  }

  // Keep generated advice labelled and retain normal editing and self-review after provider failure
  return (
    <details className="ai-feedback">
      <summary>Optional AI Feedback</summary>
      <p>
        AI-generated advice can be wrong — it does not check facts, grant
        mastery or complete this activity
      </p>
      {!token ? (
        <p>
          Use AI Settings to unlock owner access on localhost — core learning
          remains available
        </p>
      ) : (
        <>
          <label className="check">
            <input
              type="checkbox"
              checked={consent}
              onChange={(event) => setConsent(event.target.checked)}
            />
            I agree to send this saved answer or reasoning, its question, rubric
            and limited evidence context to OpenAI for a separately billed API
            request
          </label>
          <div className="actions">
            <button
              disabled={!consent || busy}
              onClick={() => void ask('review')}
            >
              Review My Answer
            </button>
            <button
              disabled={!consent || busy}
              onClick={() => void ask('explain')}
            >
              Explain This Feedback
            </button>
            {busy && (
              <button
                className="secondary"
                onClick={() => {
                  controller.current?.abort();
                  void aiRequest('cancel', token, {}).catch((reason) =>
                    setError(String(reason)),
                  );
                }}
              >
                Cancel AI Request
              </button>
            )}
          </div>
        </>
      )}
      {error && (
        <p role="alert">
          {error} — your draft and normal self-review remain available
        </p>
      )}

      {/* Label advice as belonging to the saved answer used for that request */}
      {feedback && (
        <aside>
          <h3>AI-Generated Feedback</h3>
          <p>
            For the saved answer at request time — later edits may need a new
            request
          </p>
          {(
            [
              ['strength', 'What Went Well'],
              ['improvement', 'What To Improve'],
              ['evidence', 'Evidence And Uncertainty'],
              ['nextStep', 'Next Improvement'],
            ] as const
          ).map(([key, title]) => (
            <section key={key}>
              <h4>{title}</h4>
              <p>{feedback[key]}</p>
            </section>
          ))}
        </aside>
      )}
    </details>
  );
}
