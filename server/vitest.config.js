import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globalSetup: './tests/globalSetup.js',
    setupFiles: ['./tests/setupEnv.js'],
    hookTimeout: 20000,
    testTimeout: 15000,
    pool: 'forks',
    fileParallelism: false,
    include: ['src/**/*.test.js', 'tests/**/*.test.js'],
  },
});
