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
    expect(migrated.contentVersion).toBe(lessons[1].version);
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
    expect(current.contentVersion).toBe(lessons[1].version);
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

// Exercise the real backup commands with disposable learner state and an in-memory provider credential
it('backs up and restores schema 4 quiz and model state without persisting provider credentials', async () => {
  const { execFileSync } = await import('node:child_process');
  const { readFileSync } = await import('node:fs');
  const { Store } = await import('../src/server/store.js');
  const { AiService } = await import('../src/server/ai.js');
  const directory = mkdtempSync(join(tmpdir(), 'study-backup-'));
  const source = join(directory, 'source.sqlite');
  const backup = join(directory, 'backup.sqlite');
  const restored = join(directory, 'restored.sqlite');
  const store = new Store(source, () => new Date('2026-11-06T00:00:00.000Z'));
  try {
    const lesson = lessons[0];
    let progress = store.get(lesson);
    for (const mutation of [
      { action: 'draft' as const, answer: 'wrong' },
      { action: 'check' as const },
    ])
      progress = store.update(lesson, {
        ...mutation,
        taskId: 'action',
        revision: progress.revision,
      });
    const session = store.reviews.start('English');
    const { quiz } = await import('../src/server/quiz.js');
    const { Lab } = await import('../src/server/lab.js');
    const selection = quiz(store);
    const lab = new Lab(store);
    let run = lab.update(0, 'start');
    run = lab.update(run.revision, 'pause');
    const { News } = await import('../src/server/news.js');
    const newsCatalogue = structuredClone(lessons);
    const imported = await new News(
      store,
      newsCatalogue,
      async () =>
        new Response(
          JSON.stringify({
            type: 'FeatureCollection',
            features: [
              {
                id: 'backup-event',
                properties: {
                  title: 'M 5 — Backup test region',
                  place: 'Backup test region',
                  mag: 5,
                  time: Date.UTC(2026, 0, 1),
                  url: 'https://earthquake.usgs.gov/earthquakes/eventpage/backup-event',
                },
              },
            ],
          }),
        ),
    ).update();
    const endpoint = lessons.find(
      (lesson) => lesson.id === 'cyber-endpoint-correlation',
    )!;
    store.update(
      endpoint,
      { action: 'check', taskId: 'defence-lab', revision: 0 },
      {
        id: 'backup-model-check',
        verified: false,
        assisted: false,
        state: JSON.stringify(run),
      },
    );
    const due = store.reviews.snapshot().due;
    const fakeKey = 'not-a-real-provider-key-for-backup-tests';
    const ai = new AiService(store.db);
    ai.connect(fakeKey);
    store.db
      .prepare('INSERT INTO ai_requests VALUES (?,?,?,?,?)')
      .run('backup-check', 'hash', '2026-11-05T00:00:00.000Z', 'failed', null);
    execFileSync(process.execPath, ['scripts/backup.mjs', backup], {
      env: { ...process.env, DATABASE_PATH: source },
    });
    expect(readFileSync(backup).includes(Buffer.from(fakeKey))).toBe(false);
    execFileSync(process.execPath, ['scripts/restore.mjs'], {
      env: { ...process.env, DATABASE_PATH: restored },
      input: readFileSync(backup),
    });
    const copy = new Store(
      restored,
      () => new Date('2026-11-06T00:00:00.000Z'),
    );
    try {
      expect(copy.get(lesson).tasks).toEqual(progress.tasks);
      expect(copy.reviews.snapshot().due).toEqual(due);
      expect(copy.reviews.start('English').id).toBe(session.id);
      expect(quiz(copy).id).toBe(selection.id);
      expect(new Lab(copy).read()).toEqual(run);
      const restoredCatalogue = structuredClone(lessons);
      new News(copy, restoredCatalogue);
      expect(
        restoredCatalogue
          .flatMap((lesson) => lesson.tasks)
          .find((task) => task.id === imported.id)?.passage?.text,
      ).toContain('Backup test region');
      expect(
        JSON.parse(
          String(
            copy.db
              .prepare('SELECT state FROM lab_results WHERE id=?')
              .get('backup-model-check')?.state,
          ),
        ).verified,
      ).toBe(false);
      expect(
        copy.db.prepare('SELECT count(*) AS n FROM ai_requests').get()?.n,
      ).toBe(1);
      expect(new AiService(copy.db).status().connected).toBe(false);
      expect(
        copy.db.prepare('PRAGMA integrity_check').get()?.integrity_check,
      ).toBe('ok');
    } finally {
      copy.close();
    }
  } finally {
    store.close();
    rmSync(directory, { recursive: true, force: true });
  }
});

// Run the actual CLI helper through HTTP and retain its complete and deliberately incomplete state across restore
it('smokes supported Docker progress and rejected forged lab completion through restart and backup/restore', async () => {
  const { execFile } = await import('node:child_process');
  const { promisify } = await import('node:util');
  const { readFileSync } = await import('node:fs');
  const run = promisify(execFile);
  const directory = mkdtempSync(join(tmpdir(), 'study-smoke-helper-'));
  const path = join(directory, 'study.sqlite');
  const backup = join(directory, 'backup.sqlite');
  const restored = join(directory, 'restored.sqlite');
  let app = await createApp(path, '/nonexistent', { ownerToken: undefined });
  try {
    let url = await app.listen({ port: 0, host: '127.0.0.1' });
    const written = await run(process.execPath, [
      'scripts/smoke-progress.mjs',
      url,
      'write',
    ]);
    expect(written.stdout).toContain('19/20 lessons complete');
    expect(written.stdout).toContain(
      'owner-only lab questions remain incomplete: defence-lab',
    );
    const before = (await app.inject('/api/lessons')).json<{
      progress: Progress[];
    }>();
    const endpoint = before.progress.find(
      (p) => p.lessonId === 'cyber-endpoint-correlation',
    )!;
    expect(endpoint.completedAt).toBeNull();
    expect(endpoint.tasks['defence-lab']).toMatchObject({
      answer: 'supported',
      correct: false,
      checked: false,
      attempts: 0,
    });

    // Reopen the database before the first read so this cannot pass using only a server's in-memory state
    await app.close();
    app = await createApp(path, '/nonexistent', { ownerToken: undefined });
    url = await app.listen({ port: 0, host: '127.0.0.1' });
    await run(process.execPath, ['scripts/smoke-progress.mjs', url, 'read']);
    await run(process.execPath, ['scripts/backup.mjs', backup], {
      env: { ...process.env, DATABASE_PATH: path },
    });
    await app.close();

    // Stream the real backup into the stopped-app restore command without touching normal learner data
    await new Promise<void>((resolve, reject) => {
      const child = execFile(
        process.execPath,
        ['scripts/restore.mjs'],
        { env: { ...process.env, DATABASE_PATH: restored } },
        (error) => (error ? reject(error) : resolve()),
      );
      child.stdin!.end(readFileSync(backup));
    });
    app = await createApp(restored, '/nonexistent', { ownerToken: undefined });
    url = await app.listen({ port: 0, host: '127.0.0.1' });
    await run(process.execPath, ['scripts/smoke-progress.mjs', url, 'read']);
    expect((await app.inject('/api/lessons')).json().progress).toEqual(
      before.progress,
    );

    // Simulate corrupted persisted credit and ensure read mode fails rather than silently accepting a lab tick
    await app.close();
    const { DatabaseSync } = await import('node:sqlite');
    const db = new DatabaseSync(restored);
    try {
      endpoint.tasks['defence-lab'].correct = true;
      db.prepare('UPDATE progress SET state=? WHERE lesson_id=?').run(
        JSON.stringify(endpoint),
        endpoint.lessonId,
      );
    } finally {
      db.close();
    }
    app = await createApp(restored, '/nonexistent', { ownerToken: undefined });
    url = await app.listen({ port: 0, host: '127.0.0.1' });
    await expect(
      run(process.execPath, ['scripts/smoke-progress.mjs', url, 'read']),
    ).rejects.toMatchObject({
      code: 1,
      stderr: expect.stringContaining(
        'A forged lab answer must not earn a tick',
      ),
    });
  } finally {
    await app.close();
    rmSync(directory, { recursive: true, force: true });
  }
}, 20_000);

// Fail closed if the target differs from the credential-free Docker configuration expected by this smoke flow
it('refuses to smoke an owner-enabled host as though it were the shipped Docker environment', async () => {
  const { execFile } = await import('node:child_process');
  const { promisify } = await import('node:util');
  const app = await createApp(':memory:', '/nonexistent', {
    ownerToken: 'fictional-owner-capability-for-host-boundary-test',
  });
  try {
    const url = await app.listen({ port: 0, host: '127.0.0.1' });
    await expect(
      promisify(execFile)(process.execPath, [
        'scripts/smoke-progress.mjs',
        url,
        'write',
      ]),
    ).rejects.toMatchObject({
      code: 1,
      stderr: expect.stringContaining(
        'Docker smoke requires the shipped owner-disabled configuration',
      ),
    });
    expect(
      (await app.inject('/api/lessons'))
        .json()
        .progress.every((p: Progress) => p.revision === 0),
    ).toBe(true);
  } finally {
    await app.close();
  }
});
