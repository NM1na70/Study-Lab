// Import the Vitest configuration helper and React transform
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// Run unit and UI tests with a Node default and a small worker count for local development
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'node',
    include: ['tests/**/*.test.{ts,tsx}'],
    maxWorkers: 2,
  },
});
