import { World, setWorldConstructor } from '@cucumber/cucumber';
import { API_BASE_URL } from './config.js';

/**
 * A thin HTTP client holding one cookie jar per actor.
 *
 * Scenarios name people ("Priya", "Hans"), so the world keeps a session per
 * person rather than a single ambient session. That is what lets a scenario
 * sign in as one person, act as another, and assert on the first.
 */
export class NotesWorld extends World {
  constructor(options) {
    super(options);
    /** @type {Map<string, Map<string, string>>} person -> cookie jar */
    this.jars = new Map();
    /** @type {Map<string, {id: number, userName: string, email: string, password: string}>} */
    this.people = new Map();
    /** @type {Map<string, number>} note title -> id */
    this.notes = new Map();
    /** Result of the most recent request, for Then steps to assert on. */
    this.lastResponse = undefined;
    this.lastBody = undefined;
    /** Playwright handles, created lazily by browser scenarios. */
    this.browser = undefined;
    this.page = undefined;
  }

  jarFor(person) {
    if (!this.jars.has(person)) {
      this.jars.set(person, new Map());
    }
    return this.jars.get(person);
  }

  cookieHeader(person) {
    const jar = this.jarFor(person);
    return [...jar.entries()].map(([name, value]) => `${name}=${value}`).join('; ');
  }

  storeCookies(person, response) {
    const jar = this.jarFor(person);
    const raw = response.headers.getSetCookie?.() ?? [];
    for (const cookie of raw) {
      const [pair] = cookie.split(';');
      const index = pair.indexOf('=');
      const name = pair.slice(0, index).trim();
      const value = pair.slice(index + 1).trim();
      if (value === '' || /expires=thu, 01 jan 1970/i.test(cookie)) {
        jar.delete(name);
      } else {
        jar.set(name, value);
      }
    }
  }

  /**
   * Sends a request as `person`. Mutating requests carry an Origin header,
   * because the API refuses them without one (ADR-0002 CSRF defence).
   */
  async request(person, method, path, body) {
    const headers = { Accept: 'application/json' };
    const cookies = this.cookieHeader(person);
    if (cookies) {
      headers.Cookie = cookies;
    }
    if (body !== undefined) {
      headers['Content-Type'] = 'application/json';
    }
    if (method !== 'GET') {
      headers.Origin = process.env.TEST_WEB_ORIGIN ?? `http://localhost:5274`;
    }

    const response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      redirect: 'manual',
    });

    this.storeCookies(person, response);

    const text = await response.text();
    let parsed;
    try {
      parsed = text === '' ? undefined : JSON.parse(text);
    } catch {
      parsed = text;
    }

    this.lastResponse = response;
    this.lastBody = parsed;
    return { response, body: parsed };
  }

  get(person, path) {
    return this.request(person, 'GET', path);
  }

  post(person, path, body) {
    return this.request(person, 'POST', path, body);
  }

  patch(person, path, body) {
    return this.request(person, 'PATCH', path, body);
  }

  delete(person, path) {
    return this.request(person, 'DELETE', path);
  }

  /** Anonymous visitor: a person with an empty, never-populated jar. */
  anonymous(method, path, body) {
    return this.request('__visitor__', method, path, body);
  }
}

setWorldConstructor(NotesWorld);
