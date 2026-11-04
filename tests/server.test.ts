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

// Migrate only temporary version 1 databases and verify the original JSON remains recoverable
it('migrates old summaries and completions once without losing attempts or assistance', async () => {
  const { DatabaseSync } = await import('node:sqlite');
  const { emptyProgress, emptyTask, assisted } =
    await import('../src/shared/domain.js');
  const directory = mkdtempSync(join(tmpdir(), 'study-migration-'));
  const path = join(directory, 'old.sqlite');
  const old = emptyProgress(lessons[1]);
  old.contentVersion = 1;
  old.completedAt = '2026-11-02T00:00:00.000Z';
  old.tasks['incident-note'] = {
    ...emptyTask(),
    answer: 'My earlier free-text incident summary',
    attempts: 2,
    mistakes: 1,
    hints: 2,
    solution: true,
    reviewed: true,
  };
  old.tasks['request-count'] = {
    ...emptyTask(),
    answer: '3',
    correct: true,
    attempts: 1,
  };
  old.tasks['review-limit'] = { ...emptyTask(), answer: ' No ', correct: true };
  const english = {
    ...emptyProgress(lessons[0]),
    contentVersion: 1,
    completedAt: old.completedAt,
  };
  const db = new DatabaseSync(path);
  db.exec(
    'CREATE TABLE progress (lesson_id TEXT PRIMARY KEY,state TEXT NOT NULL); PRAGMA user_version=1;',
  );
  for (const progress of [old, english])
    db.prepare('INSERT INTO progress VALUES (?,?)').run(
      progress.lessonId,
      JSON.stringify(progress),
    );
  db.close();
  let app = await createApp(path, '/nonexistent');
  try {
    const snapshot = (await app.inject('/api/lessons')).json<{
      progress: Progress[];
    }>();
    const migrated = snapshot.progress[1];
    expect(migrated.contentVersion).toBe(3);
    expect(migrated.completedAt).toBeNull();
    expect(migrated.completionHistory).toEqual([
      { contentVersion: 1, completedAt: old.completedAt, assisted: true },
    ]);
    expect(migrated.tasks['incident-note']).toMatchObject({
      answer: {},
      attempts: 2,
      mistakes: 1,
      hints: 0,
      solution: false,
      reviewed: false,
    });
    expect(migrated.tasks['incident-note'].previousWork?.[0]).toMatchObject({
      answer: old.tasks['incident-note'].answer,
      hints: 2,
      solution: true,
      reviewed: true,
    });
    expect(migrated.tasks['review-limit'].answer).toBe('no');
    expect(assisted(migrated)).toBe(true);
    expect(snapshot.progress[0].completedAt).toBe(english.completedAt);
    await app.close();
    app = await createApp(path, '/nonexistent');
    expect(
      (await app.inject('/api/lessons')).json<{ progress: Progress[] }>()
        .progress[1],
    ).toEqual(migrated);
    const verify = new DatabaseSync(path, { readOnly: true });
    try {
      expect(
        verify
          .prepare('SELECT state FROM progress_migrations WHERE lesson_id=?')
          .get(old.lessonId)?.state,
      ).toBe(JSON.stringify(old));
    } finally {
      verify.close();
    }
  } finally {
    await app.close();
    rmSync(directory, { recursive: true, force: true });
  }
});

// Keep equivalent version 2 fields and archive reasoning that cannot safely become structured choices
it('migrates report version 2 drafts and completion without inventing new assessment', async () => {
  const { DatabaseSync } = await import('node:sqlite');
  const { emptyProgress, emptyTask, assisted } =
    await import('../src/shared/domain.js');
  const directory = mkdtempSync(join(tmpdir(), 'study-report-migration-'));
  const path = join(directory, 'old.sqlite');
  const old = {
    ...emptyProgress(lessons[1]),
    contentVersion: 2,
    completedAt: '2026-11-04T00:00:00.000Z',
  };
  old.tasks['incident-note'] = {
    ...emptyTask(),
    answer: {
      source: '192.0.2.99',
      destination: '198.51.100.20',
      frames: '4, 6, 8',
      uri: '/saved-draft',
      inference: 'My earlier inference',
      unknown: 'My earlier uncertainty',
      'next-check': 'My earlier proposed check',
    },
    correct: true,
    reviewed: true,
    attempts: 3,
    mistakes: 1,
    hints: 2,
    solution: true,
    reviewDismissedMistakes: 1,
  };
  const db = new DatabaseSync(path);
  db.exec(
    'CREATE TABLE progress (lesson_id TEXT PRIMARY KEY,state TEXT NOT NULL); PRAGMA user_version=2;',
  );
  db.prepare('INSERT INTO progress VALUES (?,?)').run(
    old.lessonId,
    JSON.stringify(old),
  );
  db.close();
  const app = await createApp(path, '/nonexistent');
  try {
    const current = (await app.inject('/api/lessons')).json<{
      progress: Progress[];
    }>().progress[1];
    expect(current.contentVersion).toBe(3);
    expect(current.completedAt).toBeNull();
    expect(current.tasks['incident-note']).toMatchObject({
      answer: {
        source: '192.0.2.99',
        destination: '198.51.100.20',
        uri: '/saved-draft',
        frames: ['frame-4', 'frame-6', 'frame-8'],
      },
      correct: false,
      reviewed: false,
      attempts: 3,
      mistakes: 1,
      reviewDismissedMistakes: 1,
    });
    expect(current.tasks['incident-note'].previousWork?.[0].answer).toEqual(
      old.tasks['incident-note'].answer,
    );
    expect(current.completionHistory).toEqual([
      { contentVersion: 2, completedAt: old.completedAt, assisted: true },
    ]);
    expect(assisted(current)).toBe(true);
    expect(
      (await app.inject('/api/lessons')).json<{ progress: Progress[] }>()
        .progress[1],
    ).toEqual(current);
  } finally {
    await app.close();
    rmSync(directory, { recursive: true, force: true });
  }
});
