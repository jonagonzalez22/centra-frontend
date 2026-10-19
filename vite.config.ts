import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

// More info at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@features': path.resolve(__dirname, './src/features'),
      '@components': path.resolve(__dirname, './src/components'),
      '@shared': path.resolve(__dirname, './src/shared')
    }
  },
  test: {
    projects: [{
      extends: true,
      test: {
        environment: 'jsdom',
        globals: true,
        setupFiles: './src/tests/setup.ts',
        // Las pruebas de Ant Design + jsdom son intensivas; limitar los workers evita
        // que las interacciones de user-event excedan el timeout por contención de CPU.
        maxWorkers: 1,
        fileParallelism: false,
      }
    }]
  }
});
