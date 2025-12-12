import { defineWorkersConfig } from '@cloudflare/vitest-pool-workers/config';

export default defineWorkersConfig({
  test: {
    poolOptions: {
      workers: {
        wrangler: { configPath: './wrangler.toml' },
        miniflare: {
          // Apply database migrations before each test
          d1Databases: ['DB'],
          kvNamespaces: ['SESSIONS'],
          bindings: {
            RP_ID: 'bridge.blackhoard.com',
            RP_NAME: "The Captain's Bridge",
            RP_ORIGIN: 'https://bridge.blackhoard.com',
            ANTHROPIC_API_KEY: 'test-api-key',
            GITHUB_TOKEN: 'test-github-token',
          },
        },
      },
    },
    // Global setup to apply schema before tests run
    setupFiles: ['./test/setup.ts'],
  },
});
