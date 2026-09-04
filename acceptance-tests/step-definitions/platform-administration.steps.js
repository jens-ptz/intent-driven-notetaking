import assert from 'node:assert/strict';
import { Given, Then, When } from '@cucumber/cucumber';
import { ADMIN, createNote, ensureSignedIn, noteId, registerAndSignIn } from '../support/actors.js';

// Capitalised, so it never captures the pronoun in "he is signed in as an administrator".
Given(/^([A-Z]\w+) is signed in as an administrator$/, async function (person) {
  await ensureSignedIn(this, person);
  const { body } = await this.get(person, '/users/me');
  assert.ok(body.roles.includes('ADMIN'), `expected ${person} to hold the admin role`);
  this.adminId = body.id;
});

Given(
  '{word} requested publication of {string} before {word} requested publication of {string}',
  async function (first, firstTitle, second, secondTitle) {
    await createNote(this, first, firstTitle);
    const a = await this.post(first, `/notes/${noteId(this, firstTitle)}/publication-request`);
    assert.equal(a.response.status, 200, JSON.stringify(a.body));

    await createNote(this, second, secondTitle);
    const b = await this.post(second, `/notes/${noteId(this, secondTitle)}/publication-request`);
    assert.equal(b.response.status, 200, JSON.stringify(b.body));
  },
);

// --- reaching every note ----------------------------------------------------

Then('he sees both {string} and {string}', function (a, b) {
  const titles = this.listed.map((note) => note.title);
  assert.ok(titles.includes(a), `expected ${a} in ${JSON.stringify(titles)}`);
  assert.ok(titles.includes(b), `expected ${b} in ${JSON.stringify(titles)}`);
});

When('{word} reads that note as an administrator', async function (person) {
  await ensureSignedIn(this, person);
  const [title] = [...this.notes.keys()].slice(-1);
  await this.get(person, `/admin/notes/${noteId(this, title)}`);
});

Then('he sees its title and text', function () {
  assert.equal(this.lastResponse.status, 200, JSON.stringify(this.lastBody));
  assert.ok(typeof this.lastBody.title === 'string');
  assert.ok(typeof this.lastBody.text === 'string');
});

When('{word} changes its title to {string}', async function (person, title) {
  await ensureSignedIn(this, person);
  const [existing] = [...this.notes.keys()].slice(-1);
  const id = noteId(this, existing);
  await this.patch(person, `/admin/notes/${id}`, { title });
  // Track the note under its new title so later steps can still find it.
  this.notes.set(title, id);
});

Then("{word}'s note list shows {string}", async function (person, title) {
  const { body } = await this.get(person, '/notes');
  const titles = body.items.map((note) => note.title);
  assert.ok(titles.includes(title), `expected ${title} in ${JSON.stringify(titles)}`);
});

When('{word} deletes that note as an administrator', async function (person) {
  await ensureSignedIn(this, person);
  const [title] = [...this.notes.keys()].slice(-1);
  const { response } = await this.delete(person, `/admin/notes/${noteId(this, title)}`);
  assert.equal(response.status, 204, JSON.stringify(this.lastBody));
});

Then("it is absent from {word}'s note list", async function (person) {
  const { body } = await this.get(person, '/notes');
  const titles = body.items.map((note) => note.title);
  const [title] = [...this.notes.keys()].slice(-1);
  assert.ok(!titles.includes(title), `did not expect ${title} in ${JSON.stringify(titles)}`);
});

// --- the moderation queue ---------------------------------------------------

When('{word} opens the moderation queue', async function (person) {
  await ensureSignedIn(this, person);
  const { body } = await this.get(person, '/admin/moderation');
  this.queue = body?.items ?? [];
});

Then('it holds {string}', function (title) {
  const titles = this.queue.map((note) => note.title);
  assert.deepEqual(titles.includes(title), true, `expected ${title} in ${JSON.stringify(titles)}`);
});

Then('it does not hold {string} or {string}', function (a, b) {
  const titles = this.queue.map((note) => note.title);
  assert.ok(!titles.includes(a), `did not expect ${a} in the queue`);
  assert.ok(!titles.includes(b), `did not expect ${b} in the queue`);
});

Then('{string} is listed before {string}', function (first, second) {
  const titles = this.queue.map((note) => note.title);
  const firstIndex = titles.indexOf(first);
  const secondIndex = titles.indexOf(second);
  assert.ok(firstIndex !== -1 && secondIndex !== -1, `queue held ${JSON.stringify(titles)}`);
  assert.ok(firstIndex < secondIndex, `expected ${first} before ${second}`);
});

// --- banning and deleting accounts -----------------------------------------

When('{word} tries to ban his own account', async function (person) {
  await ensureSignedIn(this, person);
  await this.post(person, `/admin/users/${this.adminId}/ban`);
});

When('{word} tries to delete his own account as an administrator', async function (person) {
  await ensureSignedIn(this, person);
  await this.delete(person, `/admin/users/${this.adminId}`);
});

Then('{word} can still sign in', async function (person) {
  const { response } = await this.post('__probe3__', '/auth/login', {
    identifier: 'hans.admin',
    password: 'p@assw0rt',
  });
  assert.equal(response.status, 200, `${person} should still be able to sign in`);
});

When("{word} deletes {word}'s account", async function (admin, target) {
  await ensureSignedIn(this, admin);
  const account = this.people.get(target);
  const { response } = await this.delete(admin, `/admin/users/${account.id}`);
  assert.equal(response.status, 204, JSON.stringify(this.lastBody));
});

When("{word} deletes {word}'s account as an administrator", async function (admin, target) {
  await ensureSignedIn(this, admin);
  const account = this.people.get(target);
  const { response } = await this.delete(admin, `/admin/users/${account.id}`);
  assert.equal(response.status, 204, JSON.stringify(this.lastBody));
});

// --- closed to everyone else ------------------------------------------------

When('{word} tries to list all notes as an administrator', async function (person) {
  await ensureSignedIn(this, person);
  const { response } = await this.get(person, '/admin/notes');
  this.refusals = [response.status];
});

When('{word} tries to open the moderation queue', async function (person) {
  const { response } = await this.get(person, '/admin/moderation');
  this.refusals = [...(this.refusals ?? []), response.status];
});

When("{word} tries to ban {word}'s account", async function (person, target) {
  const account = this.people.get(target) ?? (await registerAndSignIn(this, target));
  // Act as `person` again: registering the target signed them in on their own jar.
  const { response } = await this.post(person, `/admin/users/${account.id}/ban`);
  this.refusals = [...(this.refusals ?? []), response.status];
});

Then('every attempt is refused as forbidden', function () {
  assert.ok(this.refusals.length >= 1, 'no attempts were recorded');
  for (const status of this.refusals) {
    assert.equal(status, 403, `expected 403 for every attempt, saw ${JSON.stringify(this.refusals)}`);
  }
});

When('the moderation queue is requested', async function () {
  await this.anonymous('GET', '/admin/moderation');
});

When('{word} replaces its tags with {string} as an administrator', async function (person, tag) {
  await ensureSignedIn(this, person);
  const note = this.taggedNotes[0];
  const { response, body } = await this.patch(person, `/admin/notes/${note.id}`, { tags: [tag] });
  assert.equal(response.status, 200, JSON.stringify(body));
  this.taggedNotes = [body];
});
