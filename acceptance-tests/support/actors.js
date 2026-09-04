import assert from 'node:assert/strict';
import { seedAdminPassword } from './database.js';

export const ADMIN = 'Hans';
const DEFAULT_PASSWORD = 'correct-horse-1';

/**
 * Scenarios name people rather than roles, so the world resolves a name to a
 * real account, registering and signing it in on first mention.
 */
export async function ensureSignedIn(world, person) {
  if (world.people.has(person)) {
    return world.people.get(person);
  }

  if (person === ADMIN) {
    const { response } = await world.post(person, '/auth/login', {
      identifier: 'hans.admin',
      password: seedAdminPassword,
    });
    assert.equal(response.status, 200, 'the seed administrator should be able to sign in');
    const account = { userName: 'hans.admin', email: 'hans.admin@example.com', password: seedAdminPassword };
    world.people.set(person, account);
    return account;
  }

  return registerAndSignIn(world, person);
}

export async function registerAndSignIn(world, person, overrides = {}) {
  const handle = person.toLowerCase();
  const account = {
    firstName: person,
    lastName: 'Tester',
    email: overrides.email ?? `${handle}@example.com`,
    userName: overrides.userName ?? handle,
    password: overrides.password ?? DEFAULT_PASSWORD,
  };

  const { response, body } = await world.post(person, '/users/register', account);
  assert.equal(response.status, 201, `registering ${person} failed: ${JSON.stringify(body)}`);
  account.id = body.id;

  const signIn = await world.post(person, '/auth/login', {
    identifier: account.userName,
    password: account.password,
  });
  assert.equal(signIn.response.status, 200, `signing ${person} in failed`);

  world.people.set(person, account);
  return account;
}

/** Creates a note owned by `person`, remembering its id by title. */
export async function createNote(world, person, title, options = {}) {
  await ensureSignedIn(world, person);
  const { response, body } = await world.post(person, '/notes', {
    title,
    text: options.text ?? `${title} body`,
    ...(options.tags ? { tags: options.tags } : {}),
  });
  assert.equal(response.status, 201, `creating "${title}" failed: ${JSON.stringify(body)}`);
  world.notes.set(title, body.id);
  return body;
}

export function noteId(world, title) {
  const id = world.notes.get(title);
  assert.ok(id !== undefined, `no note titled "${title}" was set up in this scenario`);
  return id;
}

/** Publishes a note the whole way: owner requests, administrator approves. */
export async function publishNote(world, person, title) {
  const id = noteId(world, title);
  const requested = await world.post(person, `/notes/${id}/publication-request`);
  assert.equal(requested.response.status, 200, JSON.stringify(requested.body));
  await ensureSignedIn(world, ADMIN);
  const approved = await world.post(ADMIN, `/admin/notes/${id}/approve`);
  assert.equal(approved.response.status, 200, JSON.stringify(approved.body));
}

export async function listOwnNotes(world, person, query = '') {
  const { body } = await world.get(person, `/notes${query}`);
  return body?.items ?? [];
}

export async function publicFeed(world, query = '') {
  const { body } = await world.anonymous('GET', `/public/notes${query}`);
  return body?.items ?? [];
}
