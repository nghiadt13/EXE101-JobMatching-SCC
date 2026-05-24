import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';

// Use the workspace-root copy of React/React-DOM so that hoisted dev-deps
// (e.g. @testing-library/react resolved from `<root>/node_modules`) and the
// app under test share the same module instance. Without this, two distinct
// React copies are loaded and hooks fail with "Invalid hook call" in tests.
const sharedReact = path.resolve(__dirname, '../../node_modules/react');
const sharedReactDom = path.resolve(__dirname, '../../node_modules/react-dom');

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      { find: '@', replacement: path.resolve(__dirname, '.') },
      { find: /^react$/, replacement: sharedReact },
      { find: /^react\/(.*)$/, replacement: `${sharedReact}/$1` },
      { find: /^react-dom$/, replacement: sharedReactDom },
      { find: /^react-dom\/(.*)$/, replacement: `${sharedReactDom}/$1` },
    ],
    dedupe: ['react', 'react-dom'],
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    include: ['**/*.test.{ts,tsx}', '**/__tests__/**/*.{ts,tsx}'],
    exclude: ['node_modules/**', '.next/**', 'dist/**'],
    css: false,
  },
});
