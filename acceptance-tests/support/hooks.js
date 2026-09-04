import { After, AfterAll, Before, BeforeAll, setDefaultTimeout } from '@cucumber/cucumber';
import { REPO_ROOT } from './config.js';
import { closeBrowser, closeScenarioBrowser } from './browser.js';
import {
  captureAdminPasswordHash,
  closeDatabase,
  ensureDatabase,
  migrate,
  resetToSeededState,
} from './database.js';
import { exec, startApi, startWeb, stopAll } from './processes.js';

// Booting the database, building the API and launching a browser all happen
// inside the suite, so one command runs everything from nothing.
setDefaultTimeout(30_000);

BeforeAll({ timeout: 300_000 }, async () => {
  await exec('docker', ['compose', 'up', '-d', 'db'], { cwd: REPO_ROOT });
  await waitForPostgres();
  await ensureDatabase();
  await migrate();
  await exec('npx', ['nest', 'build'], { cwd: `${REPO_ROOT}/apps/api` });
  await captureAdminPasswordHash();
  await startApi();
  await startWeb();
});

async function waitForPostgres() {
  const deadline = Date.now() + 60_000;
  let lastError = 'not attempted';
  while (Date.now() < deadline) {
    try {
      await exec('docker', ['exec', 'notes-db', 'pg_isready', '-U', 'notes'], { cwd: REPO_ROOT });
      return;
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }
  throw new Error(`PostgreSQL never became ready: ${lastError}`);
}

// Every scenario starts from an empty database plus the guaranteed
// administrator, so scenarios are order-independent and none inherits another's
// leftovers.
Before(async function () {
  await resetToSeededState();
});

After(async function () {
  await closeScenarioBrowser(this);
});

AfterAll(async () => {
  await closeBrowser();
  await stopAll();
  await closeDatabase();
});
