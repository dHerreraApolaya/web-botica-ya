import { defineConfig, mergeConfig } from 'vitest/config';
import unitConfig from './vitest.config.js';

export default mergeConfig(
  unitConfig,
  defineConfig({
    test: {
      include: ['tests/**/*.integration.test.ts'],
      fileParallelism: false,
      testTimeout: 10000,
    },
  })
);
