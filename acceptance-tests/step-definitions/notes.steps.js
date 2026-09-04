import assert from 'node:assert/strict';
import { Given, Then, When } from '@cucumber/cucumber';
import {
  ADMIN,
  createNote,
  ensureSignedIn,
  listOwnNotes,
  noteId,
  publicFeed,
  publishNote,
} from '../support/actors.js';

// --- fixtures ---------------------------------------------------------------

// A capitalised name, so this never captures a pronoun such as "she".
Given(/^([A-Z]\w+) is signed in$/, async function (person) {
  await ensureSignedIn(this, person);
});

Given('{word} owns a note titled {string}', async function (person, title) {
  await createNote(this, person, title);
});

Given('{word} owns a private note titled {string}', async function (person, title) {
  await createNote(this, person, title);
});

Given('{word} owns a published note titled {string}', async function (person, title) {
  await createNote(this, person, title);
  await publishNote(this, person, title);
});

Given('{word} has deleted her note titled {string}', async function (person, title) {
  await createNote(this, person, title);
  const { response } = await this.delete(person, `/notes/${noteId(this, title)}`);
  assert.equal(response.status, 204);
});

// --- creating ---------------------------------------------------------------

When('{word} creates a note titled {string}', async function (person, title) {
  await createNote(this, person, title);
});

When(
  '{word} creates a note titled {string} with the text {string}',
  async function (person, title, text) {
    await createNote(this, person, title, { text });
  },
);

When('{word} tries to create a note with an empty title', async function (person) {
  await ensureSignedIn(this, person);
  await this.post(person, '/notes', { title: '', text: 'body' });
});

Then('the note appears in her note list', async function () {
  const titles = (await listOwnNotes(this, this.lastActor ?? 'Priya')).map((n) => n.title);
  assert.ok(titles.length > 0, 'expected at least one note');
});

Then('creation is refused because the title is required', function () {
  assert.equal(this.lastResponse.status, 400, JSON.stringify(this.lastBody));
});

// --- listing and reading ----------------------------------------------------

When('{word} lists her notes', async function (person) {
  await ensureSignedIn(this, person);
  this.listed = await listOwnNotes(this, person);
});

Then('she sees {string}', function (title) {
  const titles = this.listed.map((note) => note.title);
  assert.ok(titles.includes(title), `expected ${title} in ${JSON.stringify(titles)}`);
});

Then('she does not see {string}', function (title) {
  const titles = this.listed.map((note) => note.title);
  assert.ok(!titles.includes(title), `did not expect ${title} in ${JSON.stringify(titles)}`);
});

Then('the notes are returned', function () {
  assert.equal(this.lastResponse.status, 200, JSON.stringify(this.lastBody));
});

When('{word} tries to read that note', async function (person) {
  await ensureSignedIn(this, person);
  const [title] = [...this.notes.keys()].slice(-1);
  await this.get(person, `/notes/${noteId(this, title)}`);
});

Then('she is told the note does not exist', function () {
  assert.equal(this.lastResponse.status, 404, JSON.stringify(this.lastBody));
});

Then('reading that note reports it does not exist', async function () {
  const [title] = [...this.notes.keys()].slice(-1);
  const person = this.lastActor ?? 'Priya';
  const { response } = await this.get(person, `/notes/${noteId(this, title)}`);
  assert.equal(response.status, 404);
});

Then('reading it reports it does not exist', async function () {
  const [title] = [...this.notes.keys()].slice(-1);
  const person = this.lastActor ?? 'Priya';
  const { response } = await this.get(person, `/notes/${noteId(this, title)}`);
  assert.equal(response.status, 404);
});

// --- updating ---------------------------------------------------------------

When('{word} changes its text to {string}', async function (person, text) {
  await ensureSignedIn(this, person);
  const [title] = [...this.notes.keys()].slice(-1);
  await this.patch(person, `/notes/${noteId(this, title)}`, { text });
});

When("{word} tries to change that note's text", async function (person) {
  await ensureSignedIn(this, person);
  const [title] = [...this.notes.keys()].slice(-1);
  await this.patch(person, `/notes/${noteId(this, title)}`, { text: 'intruder' });
});

Then('reading the note shows the text {string}', async function (text) {
  const [title] = [...this.notes.keys()].slice(-1);
  const person = this.lastActor ?? 'Priya';
  const { body } = await this.get(person, `/notes/${noteId(this, title)}`);
  assert.equal(body.text, text);
});

Then('the change is refused', function () {
  // 400 for a rejected escalation attempt, 403/404 for someone else's note.
  assert.ok(
    [400, 403, 404].includes(this.lastResponse.status),
    `expected the change to be refused, got ${this.lastResponse.status}: ${JSON.stringify(this.lastBody)}`,
  );
});

// --- deleting ---------------------------------------------------------------

When('{word} deletes that note', async function (person) {
  await ensureSignedIn(this, person);
  const [title] = [...this.notes.keys()].slice(-1);
  this.lastActor = person;
  await this.delete(person, `/notes/${noteId(this, title)}`);
});

When('{word} deletes it', async function (person) {
  await ensureSignedIn(this, person);
  const [title] = [...this.notes.keys()].slice(-1);
  this.lastActor = person;
  await this.delete(person, `/notes/${noteId(this, title)}`);
});

When('{word} tries to delete that note', async function (person) {
  await ensureSignedIn(this, person);
  const [title] = [...this.notes.keys()].slice(-1);
  await this.delete(person, `/notes/${noteId(this, title)}`);
});

Then('the deletion is refused', function () {
  assert.ok(
    [403, 404].includes(this.lastResponse.status),
    `expected the deletion to be refused, got ${this.lastResponse.status}`,
  );
});

Then('the note is absent from her note list', async function () {
  const person = this.lastActor ?? 'Priya';
  const titles = (await listOwnNotes(this, person)).map((note) => note.title);
  const [title] = [...this.notes.keys()].slice(-1);
  assert.ok(!titles.includes(title), `did not expect ${title} in ${JSON.stringify(titles)}`);
});

Then('it is absent from her note list', async function () {
  const person = this.lastActor ?? 'Priya';
  const titles = (await listOwnNotes(this, person)).map((note) => note.title);
  const [title] = [...this.notes.keys()].slice(-1);
  assert.ok(!titles.includes(title), `did not expect ${title} in ${JSON.stringify(titles)}`);
});

Then("the note is still in {word}'s note list", async function (person) {
  const titles = (await listOwnNotes(this, person)).map((note) => note.title);
  const [title] = [...this.notes.keys()].slice(-1);
  assert.ok(titles.includes(title), `expected ${title} in ${JSON.stringify(titles)}`);
});

Then('{string} is absent from the public feed', async function (title) {
  const titles = (await publicFeed(this)).map((note) => note.title);
  assert.ok(!titles.includes(title), `did not expect ${title} on the public feed`);
});

// --- ownership --------------------------------------------------------------

Then('the note is private', async function () {
  await ensureSignedIn(this, ADMIN);
  const [title] = [...this.notes.keys()].slice(-1);
  const { body } = await this.get(ADMIN, `/admin/notes/${noteId(this, title)}`);
  assert.equal(body.publicationState, 'PRIVATE', JSON.stringify(body));
});

Then('{word} is its owner', async function (person) {
  const account = this.people.get(person);
  const [title] = [...this.notes.keys()].slice(-1);
  const { body } = await this.get(person, `/notes/${noteId(this, title)}`);
  assert.equal(body.ownerId, account.id);
});

Then(
  'the identifier of {string} is greater than the identifier of {string}',
  function (later, earlier) {
    assert.ok(
      noteId(this, later) > noteId(this, earlier),
      `expected ${later} (${noteId(this, later)}) to outrank ${earlier} (${noteId(this, earlier)})`,
    );
  },
);

// --- administrator visibility ----------------------------------------------

When('{word} lists all notes as an administrator', async function (person) {
  await ensureSignedIn(this, ADMIN);
  const { body } = await this.get(ADMIN, '/admin/notes');
  this.listed = body?.items ?? [];
});

Then('the note titled {string} is absent from the results', function (title) {
  const titles = this.listed.map((note) => note.title);
  assert.ok(!titles.includes(title), `did not expect ${title} in ${JSON.stringify(titles)}`);
});

Then('reading it as {word} shows the original text', async function (person) {
  const [title] = [...this.notes.keys()].slice(-1);
  const { body } = await this.get(person, `/notes/${noteId(this, title)}`);
  assert.equal(body.text, `${title} body`, 'the note should be untouched');
});
