// Verify state transitions with a controlled scenario clock and no host runtime
import { it, expect } from 'vitest';
import { Store } from '../src/server/store.js';
import { Lab } from '../src/server/lab.js';

it('pauses progression, retains state and requires containment plus portal availability', () => {
  let now = 0;
  const store = new Store(':memory:');
  const lab = new Lab(store, () => now);
  try {
    let state = lab.update(0, 'start');
    now = 20000;
    state = lab.update(state.revision, 'pause');
    expect(state.elapsed).toBe(20);
    now = 100000;
    state = lab.update(state.revision, 'tick');
    expect(state.elapsed).toBe(20);
    state = lab.update(state.revision, 'resume');
    now = 130000;
    state = lab.update(state.revision, 'tick');
    for (const command of [
      'ps',
      'ss',
      'accounts',
      'journalctl',
      'deny all',
      'disable lab-test',
      'stop probe',
    ])
      state = lab.update(state.revision, 'command', command);
    expect(lab.objectives(state).verified).toBe(false);
    state = lab.update(state.revision, 'command', 'allow portal');
    expect(lab.objectives(state).verified).toBe(true);
    expect(new Lab(store, () => now).read()).toMatchObject({
      ...state,
      running: false,
      revision: state.revision + 1,
      history: expect.any(Array),
    });
    state = lab.read();
    state = lab.update(state.revision, 'resume');
    expect(() =>
      lab.update(state.revision, 'command', 'cat /etc/passwd'),
    ).toThrow(/Unsupported/);
    state = lab.update(state.revision, 'reset');
    expect(state.elapsed).toBe(0);
    expect(
      store.db.prepare('SELECT count(*) AS n FROM lab_history').get()?.n,
    ).toBe(1);
  } finally {
    store.close();
  }
});

// Require the existing owner capability and a direct local socket for every model operation
it('blocks anonymous and LAN callers and stops progression at the session limit', async () => {
  const { createApp } = await import('../src/server/app.js');
  const owner = 'temporary-lab-owner-capability-for-unit-tests';
  const app = await createApp(':memory:', '/nonexistent', {
    ownerToken: owner,
  });
  try {
    expect((await app.inject('/api/lab')).statusCode).toBe(403);
    expect(
      (
        await app.inject({
          method: 'POST',
          url: '/api/lab',
          remoteAddress: '192.0.2.99',
          headers: { 'x-study-owner': owner },
          payload: { revision: 0, action: 'start' },
        })
      ).statusCode,
    ).toBe(403);
    expect(
      (
        await app.inject({
          method: 'POST',
          url: '/api/lab',
          headers: { 'x-study-owner': owner },
          payload: { revision: 0, action: 'start' },
        })
      ).statusCode,
    ).toBe(200);
  } finally {
    await app.close();
  }
  let now = 0;
  const store = new Store(':memory:');
  try {
    const lab = new Lab(store, () => now);
    let state = lab.update(0, 'start');
    now = 3600000;
    state = lab.update(state.revision, 'tick');
    expect(state.elapsed).toBe(1800);
    expect(state.running).toBe(false);
    expect(() => lab.update(state.revision, 'resume')).toThrow(/Session limit/);
  } finally {
    store.close();
  }
});

// Only the live verified model can grant the catalogue tick, with assistance and failed checks retained
it('rejects forged question checks and shares verified lab results with the lesson', async () => {
  const { createApp } = await import('../src/server/app.js');
  const owner = 'temporary-capability-for-authoritative-lab-tests';
  let clock = Date.now();
  const app = await createApp(
    ':memory:',
    '/nonexistent',
    { ownerToken: owner },
    { labClock: () => clock },
  );
  try {
    const snapshot = (await app.inject('/api/lessons')).json();
    const lesson = snapshot.lessons.find(
      (lesson: { id: string }) => lesson.id === 'cyber-endpoint-correlation',
    );
    let progress = snapshot.progress.find(
      (progress: { lessonId: string }) => progress.lessonId === lesson.id,
    );
    expect(
      (
        await app.inject({
          method: 'POST',
          url: '/api/progress/' + lesson.id,
          payload: {
            action: 'check',
            taskId: 'defence-lab',
            revision: progress.revision,
          },
        })
      ).statusCode,
    ).toBe(400);
    const headers = { 'x-study-owner': owner };

    // A bridge caller cannot turn a known token or forwarded loopback address into direct owner access
    const denied = await app.inject({
      method: 'POST',
      url: '/api/lab/verify',
      remoteAddress: '172.18.0.1',
      headers: {
        ...headers,
        host: 'localhost',
        'x-forwarded-for': '127.0.0.1',
      },
      payload: { revision: progress.revision },
    });
    expect(denied.statusCode).toBe(403);
    const unchanged = (await app.inject('/api/lessons'))
      .json()
      .progress.find(
        (state: { lessonId: string }) => state.lessonId === lesson.id,
      );
    expect(unchanged).toEqual(progress);

    // Even an authorised owner cannot supply a success flag in place of live objective proof
    const forged = await app.inject({
      method: 'POST',
      url: '/api/lab/verify',
      headers,
      payload: { revision: progress.revision, verified: true },
    });
    expect(forged.statusCode).toBe(400);

    // Legitimate verification records incomplete objectives as a failed attempt without granting credit
    const failed = await app.inject({
      method: 'POST',
      url: '/api/lab/verify',
      headers,
      payload: { revision: progress.revision },
    });
    expect(failed.statusCode).toBe(200);
    progress = failed.json();
    expect(progress.tasks['defence-lab'].correct).toBe(false);
    expect(progress.tasks['defence-lab'].attempts).toBe(1);
    expect(progress.completedAt).toBeNull();
    expect(progress.tasks['defence-lab'].attemptLog.at(-1).correct).toBe(false);
    let state = (
      await app.inject({
        method: 'POST',
        url: '/api/lab',
        headers,
        payload: { revision: 0, action: 'start' },
      })
    ).json();
    clock += 46000;
    for (const command of [
      'ps',
      'ss',
      'accounts',
      'journalctl',
      'block 198.51.100.99',
      'disable lab-test',
      'stop probe',
    ])
      state = (
        await app.inject({
          method: 'POST',
          url: '/api/lab',
          headers,
          payload: { revision: state.revision, action: 'command', command },
        })
      ).json();
    const verified = await app.inject({
      method: 'POST',
      url: '/api/lab/verify',
      headers,
      payload: { revision: progress.revision },
    });
    expect(verified.statusCode).toBe(200);
    const next = verified.json();
    expect(next.tasks['defence-lab'].correct).toBe(true);
    expect(next.tasks['defence-lab'].attempts).toBe(2);
    expect(next.completedAt).toBeNull();
    const duplicate = await app.inject({
      method: 'POST',
      url: '/api/lab/verify',
      headers,
      payload: { revision: next.revision },
    });
    expect(duplicate.json().tasks['defence-lab'].attempts).toBe(2);
  } finally {
    await app.close();
  }
});
