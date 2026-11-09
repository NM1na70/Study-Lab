// Validate fixed-source snapshots and failed-update retention using mocked external responses only
import { it, expect, vi } from 'vitest';
import { Store } from '../src/server/store.js';
import { News } from '../src/server/news.js';
import { lessons } from '../src/shared/lessons.js';
import { fieldCorrect } from '../src/shared/domain.js';

// Use an inert event fixture so snapshot checks never depend on the live feed
const payload = {
  type: 'FeatureCollection',
  features: [
    {
      id: 'lab-event',
      properties: {
        title: 'M 5.0 — Fictional training region',
        place: 'Fictional training region',
        mag: 5,
        time: Date.UTC(2026, 0, 1),
        url: 'https://earthquake.usgs.gov/earthquakes/eventpage/lab-event',
      },
    },
  ],
};
it('validates immutable passage fields, retains snapshots across restart and leaves them intact after failure', async () => {
  const store = new Store(':memory:');
  const catalogue = structuredClone(lessons);
  const transport = vi
    .fn<typeof fetch>()
    .mockResolvedValueOnce(new Response(JSON.stringify(payload)))
    .mockRejectedValueOnce(Error('offline'));
  try {
    const news = new News(store, catalogue, transport);
    const result = await news.update();
    const task = catalogue
      .flatMap((lesson) => lesson.tasks)
      .find((task) => task.id === result.id)!;
    expect(task.passage?.text).toContain('Reported magnitude: 5');
    expect(
      task.fields
        .filter((field) => field.kind !== 'reasoning')
        .every((field) => fieldCorrect(field, field.example)),
    ).toBe(true);
    const snapshot = JSON.stringify(task);
    await expect(news.update()).rejects.toThrow(/previous offline reading/);
    expect(JSON.stringify(task)).toBe(snapshot);
    const reopened = structuredClone(lessons);
    new News(store, reopened, transport);
    expect(
      reopened
        .flatMap((lesson) => lesson.tasks)
        .find((task) => task.id === result.id),
    ).toEqual(task);
    expect(
      transport.mock.calls.every(
        (call) =>
          String(call[0]) ===
          'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/significant_week.geojson',
      ),
    ).toBe(true);
  } finally {
    store.close();
  }
});
it.each([
  '{}',
  JSON.stringify({ ...payload, features: [] }),
  JSON.stringify({
    ...payload,
    features: [
      {
        ...payload.features[0],
        properties: {
          ...payload.features[0].properties,
          url: 'https://untrusted.test/',
        },
      },
    ],
  }),
])('does not publish an invalid reading pack', async (body) => {
  const store = new Store(':memory:');
  try {
    const catalogue = structuredClone(lessons);
    const count = catalogue.flatMap((lesson) => lesson.tasks).length;
    await expect(
      new News(store, catalogue, async () => new Response(body)).update(),
    ).rejects.toThrow(/previous offline reading/);
    expect(catalogue.flatMap((lesson) => lesson.tasks).length).toBe(count);
    expect(
      store.db.prepare('SELECT count(*) AS n FROM news_snapshots').get()?.n,
    ).toBe(0);
  } finally {
    store.close();
  }
});

it('rejects oversized streaming responses and concurrent updates before publishing', async () => {
  const store = new Store(':memory:');
  try {
    const catalogue = structuredClone(lessons);
    await expect(
      new News(
        store,
        catalogue,
        async () => new Response(new Uint8Array(262145)),
      ).update(),
    ).rejects.toThrow(/previous offline reading/);
    let release!: (response: Response) => void;
    const waiting = new Promise<Response>((resolve) => {
      release = resolve;
    });
    const news = new News(store, catalogue, async () => waiting);
    const first = news.update();
    await expect(news.update()).rejects.toThrow(/already running/);
    release(new Response(JSON.stringify(payload)));
    await first;
    expect(
      store.db.prepare('SELECT count(*) AS n FROM news_snapshots').get()?.n,
    ).toBe(1);
  } finally {
    store.close();
  }
});
