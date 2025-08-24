import { defineConfig, devices } from '@playwright/test';

// Playwright config: tests run in `tests/e2e`. baseURL points to the
// local dev server or production preview; CI workflow uses build+start.
export default defineConfig({
    testDir: 'tests/e2e',
    retries: 1,
    timeout: 30_000,
    webServer: {
        command: 'npm run dev',
        url: 'http://localhost:3000',
        reuseExistingServer: process.env.CI ? false : true,
        timeout: 120_000,
    },
    use: {
        baseURL: process.env.PW_BASE_URL || 'http://localhost:3000',
        headless: true,
        viewport: { width: 1280, height: 720 },
        actionTimeout: 10_000,
    },
    projects: [
        { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
        { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
        { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    ],
});
