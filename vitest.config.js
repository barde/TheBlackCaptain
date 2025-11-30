const { defineConfig } = require('vitest/config');

module.exports = defineConfig({
  test: {
    // Test environment
    environment: 'node',

    // Include patterns
    include: ['tests/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts}'],

    // Exclude patterns
    exclude: ['node_modules', 'public', 'tests/e2e/**'],

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.js'],
      exclude: ['src/index.js'], // Entry point excluded
    },

    // Timeouts
    testTimeout: 10000,
    hookTimeout: 10000,

    // Reporter
    reporters: ['verbose'],

    // Global test utilities - inject describe, it, expect
    globals: true,
  },
});
