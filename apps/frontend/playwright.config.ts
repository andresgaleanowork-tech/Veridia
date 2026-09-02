import { defineConfig } from '@playwright/test';

/**
 * E2E de Veridia HealthTech (Playwright).
 *
 * Requiere la API corriendo (con DB + seed) y el proxy de Vite apuntando a ella:
 *   - Docker:  API en :3457 (host.docker.internal) — default del proxy
 *   - Host/CI: API en :3456 → VITE_PROXY_TARGET=http://localhost:3456 pnpm e2e
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI
    ? [['github'], ['html', { open: 'never' }], ['json', { outputFile: 'e2e/.results/results.json' }]]
    : 'list',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [
    // Login único → estado reutilizado por todos los tests (menos peticiones,
    // más determinismo, sin rozar el rate limiter de logins del backend).
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },
    {
      name: 'chromium',
      use: {
        browserName: 'chromium',
        storageState: 'e2e/.auth/state.json',
      },
      dependsOn: ['setup'],
    },
  ],
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
