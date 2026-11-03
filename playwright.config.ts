// Import the shared configuration helper for the existing browser scenarios
import { defineConfig } from '@playwright/test';

// Keep browser scenarios sequential and retain traces only when a test fails
export default defineConfig({
  testDir: 'tests/browser',
  fullyParallel: false,
  workers: 1,
  timeout: 90000,
  use: {
    actionTimeout: 15000,
    trace: 'retain-on-failure',
  },

  // Exercise the same study flows at desktop and phone-sized viewports
  projects: [
    { name: 'desktop', use: { viewport: { width: 1280, height: 900 } } },
    {
      name: 'mobile',
      use: {
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
      },
    },
  ],
  reporter: [['list'], ['html', { open: 'never' }]],
});
