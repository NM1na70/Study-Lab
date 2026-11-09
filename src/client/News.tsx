// Import fresh reading only after an explicit owner action and retain offline packs on failure
import { useState } from 'react';

// Offer a manual owner import while keeping the current quiz selection unchanged
export function NewsUpdate({
  onUpdated,
}: { onUpdated?: () => Promise<void> } = {}) {
  // Retain owner input and request feedback in this view rather than browser storage
  const [token, setToken] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  // Show the fixed source and offline fallback alongside the explicit import action
  return (
    <details>
      <summary>Optional Fresh News</summary>
      <p>
        Update from the fixed USGS significant-earthquake feed — no AI,
        arbitrary URL or background update is used
      </p>
      <p>
        Bundled Medium and Hard news reading stays available offline — each
        imported snapshot keeps its own questions and reported values
      </p>
      <label>
        News Owner Token
        <input
          type="password"
          autoComplete="off"
          value={token}
          onChange={(event) => setToken(event.target.value)}
        />
      </label>
      <button
        disabled={busy || !token}
        onClick={async () => {
          setBusy(true);
          try {
            const response = await fetch('/api/news/update', {
              method: 'POST',
              headers: { 'X-Study-Owner': token },
            });
            const result = await response.json();
            if (!response.ok) throw Error(result.error);
            await onUpdated?.();
            setMessage(
              result.message +
                ' — the current quiz selection remains unchanged until Refresh',
            );
            setToken('');
          } catch (reason) {
            setMessage(String(reason));
          } finally {
            setBusy(false);
          }
        }}
      >
        Update News
      </button>
      <p role="status">{message}</p>
    </details>
  );
}
