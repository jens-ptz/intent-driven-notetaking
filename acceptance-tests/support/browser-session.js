import { browserFor } from './browser.js';
import { WEB_BASE_URL } from './config.js';
import { pagesFor } from './pages/index.js';
import { ensureSignedIn } from './actors.js';

/** Opens a browser for the scenario if one is not open yet. */
export async function browserPages(world) {
  if (!world.pages) {
    const page = await browserFor(world);
    world.pages = pagesFor(page);
  }
  return world.pages;
}

/**
 * Carries an HTTP session into the browser.
 *
 * The session cookie has no Domain attribute and cookie matching ignores the
 * port, so the cookie the API set on localhost:3210 is valid for Vite on
 * localhost:5274. Injecting it beats driving the sign-in form in every
 * scenario that merely needs to be signed in - the scenarios that are actually
 * about signing in use the form.
 */
export async function signInBrowser(world, person) {
  await ensureSignedIn(world, person);
  const token = world.jarFor(person).get('access_token');
  if (!token) {
    throw new Error(`No session cookie for ${person}; sign-in must have failed`);
  }

  await browserPages(world);
  await world.context.clearCookies();
  // `url` rather than `domain`: an explicit Domain attribute would create a
  // domain cookie, which is a different cookie from the host-only one the API
  // sets and clears - sign-out would then leave the injected one behind.
  await world.context.addCookies([
    { name: 'access_token', value: token, url: WEB_BASE_URL, httpOnly: true },
  ]);
  world.browserSignedInAs = person;
}

export async function signOutBrowser(world) {
  await browserPages(world);
  await world.context.clearCookies();
  world.browserSignedInAs = undefined;
}
