import { test as base, expect } from '@playwright/test';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createApp } from '../../src/server/app.js';
// Each test has a real HTTP server and its own SQLite profile; browser contexts share it.
export const test = base.extend({
  baseURL: async ({ browserName }, provide) => {
    const directory = mkdtempSync(
      join(tmpdir(), `study-browser-${browserName}-`),
    );
    const app = await createApp(join(directory, 'study.sqlite'));
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
