// Import the Vite configuration helper and React plugin
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Build local React assets and preserve the incoming Host header through the development API proxy
export default defineConfig({
  plugins: [react()],
  build: { outDir: 'dist/client' },
  server: {
    proxy: { '/api': { target: 'http://127.0.0.1:3000', changeOrigin: false } },
  },
});
