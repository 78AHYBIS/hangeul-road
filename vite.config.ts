import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { serviceWorker } from './scripts/sw-plugin.ts';

export default defineConfig({
  // Relative base: the build works on GitHub Pages (/hangeul-road/) and anywhere else.
  base: './',
  plugins: [react(), tailwindcss(), serviceWorker()],
  test: {
    environment: 'node',
    setupFiles: ['src/test-setup.ts'],
  },
});
