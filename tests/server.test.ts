// Import the HTTP app and temporary-file helpers for isolated persistence scenarios
import { it, expect } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createApp } from '../src/server/app.js';
import { lessons } from '../src/shared/lessons.js';
import type { Progress } from '../src/shared/schema.js';

// Use an isolated SQLite file to check input boundaries, competing writes, and server recreation
it('validates requests, rejects cross-origin writes and preserves answers after server recreation', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'study-test-'));
  const path = join(dir, 'test.sqlite');
  let app = await createApp(path, '/nonexistent');
  try {
    expect((await app.inject('/api/health')).statusCode).toBe(200);
    expect(
      (
        await app.inject({
          url: '/api/health',
          headers: { host: 'rebind.attacker.test' },
        })
      ).statusCode,
    ).toBe(403);
    expect(
      (
        await app.inject({
          method: 'POST',
          url: '/api/progress/' + lessons[0].id,
          payload: { action: 'draft', revision: -1 },
        })
      ).statusCode,
    ).toBe(400);
    expect(
      (
        await app.inject({
          method: 'POST',
          url: '/api/progress/' + lessons[0].id,
          headers: { origin: 'http://untrusted.test' },
          payload: { action: 'step', revision: 0, step: 1 },
        })
      ).statusCode,
    ).toBe(403);
    const url = '/api/progress/' + lessons[0].id;
    const first = await app.inject({
      method: 'POST',
      url,
      payload: {
        action: 'draft',
        revision: 0,
        taskId: 'action',
        answer: 'action',
      },
    });
    expect(first.statusCode).toBe(200);

    // Submit the same revision twice so exactly one write must win and the other must conflict
    const results = await Promise.all([
      app.inject({
        method: 'POST',
        url,
        payload: { action: 'check', revision: 1, taskId: 'action' },
      }),
      app.inject({
        method: 'POST',
        url,
        payload: {
          action: 'draft',
          revision: 1,
          taskId: 'action',
          answer: 'stale',
        },
      }),
    ]);
    expect(results.map((r) => r.statusCode).sort()).toEqual([200, 409]);

    // Reopen the same file to distinguish backend persistence from an in-memory response
    await app.close();
    app = await createApp(path, '/nonexistent');
    const result = (await app.inject('/api/lessons')).json<{
      progress: Progress[];
    }>();
    expect(result.progress[0].tasks.action.answer).toBe('action');
    expect(result.progress[0].tasks.action.correct).toBe(true);
  } finally {
    await app.close();
    rmSync(dir, { recursive: true, force: true });
  }
});
