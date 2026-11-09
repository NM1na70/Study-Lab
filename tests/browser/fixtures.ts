// Import browser fixtures and server or filesystem helpers for isolated learner profiles
import { test as base, expect } from '@playwright/test';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createApp } from '../../src/server/app.js';

// Give each test a real HTTP server and isolated SQLite profile shared only by its browser contexts
export const test = base.extend<{
  ownerAi: boolean;
  labTime: { offset: number };
  advanceLab: (ms: number) => void;
}>({
  ownerAi: [false, { option: true }],
  labTime: async ({ browserName }, provide) => {
    void browserName;
    await provide({ offset: 0 });
  },
  advanceLab: async ({ labTime }, provide) =>
    provide((ms) => {
      labTime.offset += ms;
    }),
  baseURL: async ({ browserName, ownerAi, labTime }, provide) => {
    const directory = mkdtempSync(
      join(tmpdir(), `study-browser-${browserName}-`),
    );

    // Mock owner providers and advance only the model clock, with no paid call or host operation
    const app = await createApp(
      join(directory, 'study.sqlite'),
      undefined,
      {
        ownerToken: ownerAi
          ? 'test-owner-capability-with-at-least-thirty-two-characters'
          : undefined,
        fetch: async (url) =>
          String(url).includes('/models/')
            ? new Response(JSON.stringify({ id: 'gpt-5.6-terra' }))
            : new Response(
                JSON.stringify({
                  status: 'completed',
                  output: [
                    {
                      type: 'message',
                      content: [
                        {
                          type: 'output_text',
                          text: JSON.stringify({
                            strength: 'You identified the observed state',
                            improvement: 'Keep the action owner explicit',
                            evidence: 'The evidence does not establish intent',
                            nextStep: 'Add one focused next check',
                          }),
                        },
                      ],
                    },
                  ],
                }),
              ),
      },
      {
        labClock: () => Date.now() + labTime.offset,
        newsFetch: async () =>
          new Response(
            JSON.stringify({
              type: 'FeatureCollection',
              features: [
                {
                  id: 'test-event',
                  properties: {
                    title: 'M 5.0 — Fictional test region',
                    place: 'Fictional test region',
                    mag: 5,
                    time: Date.UTC(2026, 10, 5),
                    url: 'https://earthquake.usgs.gov/earthquakes/eventpage/test-event',
                  },
                },
              ],
            }),
          ),
      },
    );

    // Bind an ephemeral loopback port and remove only this fixture database during teardown
    const url = await app.listen({ port: 0, host: '127.0.0.1' });
    try {
      await provide(url);
    } finally {
      await app.close();
      rmSync(directory, { recursive: true, force: true });
    }
  },
});
export { expect };
