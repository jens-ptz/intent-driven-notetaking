import { chromium } from '@playwright/test';

let browser;

/**
 * One browser for the whole run, one fresh context per scenario.
 *
 * Launched lazily so an API-only run never pays for a browser it does not use.
 */
export async function browserFor(world) {
  if (!browser) {
    browser = await chromium.launch();
  }
  const context = await browser.newContext();
  world.context = context;
  world.page = await context.newPage();
  return world.page;
}

export async function closeScenarioBrowser(world) {
  if (world.context) {
    await world.context.close();
    world.context = undefined;
    world.page = undefined;
  }
}

export async function closeBrowser() {
  if (browser) {
    await browser.close();
    browser = undefined;
  }
}
