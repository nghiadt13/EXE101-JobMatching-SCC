import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';

// Mirrors apps/web/tsconfig.json:
//   "baseUrl": "." (implicit), "paths": { "@/*": ["./*"] }
// so imports like `@/components/foo` resolve to apps/web/components/foo.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
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
