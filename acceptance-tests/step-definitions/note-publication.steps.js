import assert from 'node:assert/strict';
import { Given, Then, When } from '@cucumber/cucumber';
import { ADMIN, createNote, ensureSignedIn, noteId, publicFeed, publishNote } from '../support/actors.js';

async function requestPublication(world, person, title) {
  await ensureSignedIn(world, person);
  return world.post(person, `/notes/${noteId(world, title)}/publication-request`);
}

function lastTitle(world) {
  return [...world.notes.keys()].slice(-1)[0];
}

// --- requesting -------------------------------------------------------------

Given("{word}'s note {string} is pending publication", async function (person, title) {
  await createNote(this, person, title);
  const { response } = await requestPublication(this, person, title);
  assert.equal(response.status, 200, JSON.stringify(this.lastBody));
});

When('{word} requests publication of that note', async function (person) {
  this.lastActor = person;
  await requestPublication(this, person, lastTitle(this));
});

When('{word} tries to request publication of that note', async function (person) {
  await requestPublication(this, person, lastTitle(this));
});

When('{word} requests publication of that note again', async function (person) {
  await requestPublication(this, person, lastTitle(this));
});

Then('the note is pending publication', async function () {
  const person = this.lastActor ?? 'Priya';
  const { body } = await this.get(person, `/notes/${noteId(this, lastTitle(this))}`);
  assert.equal(body.publicationState, 'PENDING', JSON.stringify(body));
});

Then('the note is still pending publication', async function () {
  await ensureSignedIn(this, ADMIN);
  const { body } = await this.get(ADMIN, `/admin/notes/${noteId(this, lastTitle(this))}`);
  assert.equal(body.publicationState, 'PENDING');
});

Then('the request is refused', function () {
  assert.ok(
    [400, 403, 404].includes(this.lastResponse.status),
    `expected a refusal, got ${this.lastResponse.status}`,
  );
});

Then('the request is refused as redundant', function () {
  assert.equal(this.lastResponse.status, 400, JSON.stringify(this.lastBody));
  assert.equal(this.lastBody.code, 'ALREADY_REQUESTED', JSON.stringify(this.lastBody));
});

Then('the note is still private', async function () {
  await ensureSignedIn(this, ADMIN);
  const { body } = await this.get(ADMIN, `/admin/notes/${noteId(this, lastTitle(this))}`);
  assert.equal(body.publicationState, 'PRIVATE');
});

// --- deciding ---------------------------------------------------------------

When('{word} approves that note', async function (person) {
  await ensureSignedIn(this, person);
  await this.post(person, `/admin/notes/${noteId(this, lastTitle(this))}/approve`);
});

When('{word} tries to approve that note', async function (person) {
  await ensureSignedIn(this, person);
  await this.post(person, `/admin/notes/${noteId(this, lastTitle(this))}/approve`);
});

When('{word} rejects that note with the reason {string}', async function (person, reason) {
  await ensureSignedIn(this, person);
  await this.post(person, `/admin/notes/${noteId(this, lastTitle(this))}/reject`, { reason });
});

Then('the note is published', async function () {
  await ensureSignedIn(this, ADMIN);
  const { body } = await this.get(ADMIN, `/admin/notes/${noteId(this, lastTitle(this))}`);
  assert.equal(body.publicationState, 'PUBLISHED');
});

Then('{string} is listed on the public feed', async function (title) {
  const titles = (await publicFeed(this)).map((note) => note.title);
  assert.ok(titles.includes(title), `expected ${title} on the feed, saw ${JSON.stringify(titles)}`);
});

Then('{string} is listed on the public feed again', async function (title) {
  const titles = (await publicFeed(this)).map((note) => note.title);
  assert.ok(titles.includes(title), `expected ${title} back on the feed`);
});

Then('the note is private again', async function () {
  await ensureSignedIn(this, ADMIN);
  const { body } = await this.get(ADMIN, `/admin/notes/${noteId(this, lastTitle(this))}`);
  assert.equal(body.publicationState, 'PRIVATE');
});

Then('{word} can read the rejection reason {string}', async function (person, reason) {
  const { body } = await this.get(person, `/notes/${noteId(this, lastTitle(this))}`);
  assert.equal(body.rejectionReason, reason, JSON.stringify(body));
});

Then('the attempt is refused', function () {
  assert.ok(
    [400, 403, 404].includes(this.lastResponse.status),
    `expected a refusal, got ${this.lastResponse.status}`,
  );
});

// --- editing a published note ----------------------------------------------

Given(
  "{word}'s published note {string} went back to pending after she edited it",
  async function (person, title) {
    await createNote(this, person, title);
    await publishNote(this, person, title);
    const { response } = await this.patch(person, `/notes/${noteId(this, title)}`, {
      text: 'a different article entirely',
    });
    assert.equal(response.status, 200, JSON.stringify(this.lastBody));
  },
);

// --- withdrawing ------------------------------------------------------------

When('{word} withdraws it from publication', async function (person) {
  this.lastActor = person;
  await this.delete(person, `/notes/${noteId(this, lastTitle(this))}/publication`);
});

When('{word} withdraws that note from publication', async function (person) {
  await ensureSignedIn(this, person);
  await this.delete(person, `/notes/${noteId(this, lastTitle(this))}/publication`);
});

Then("it is still in {word}'s note list", async function (person) {
  const { body } = await this.get(person, '/notes');
  const titles = body.items.map((note) => note.title);
  assert.ok(titles.includes(lastTitle(this)), `expected the note still listed for ${person}`);
});

// --- the anonymous feed -----------------------------------------------------

When('a visitor browses the public feed', async function () {
  this.listed = await publicFeed(this);
});

When('a visitor with no account browses the public feed', async function () {
  this.listed = await publicFeed(this);
});

Then('{string} is not listed', function (title) {
  const titles = this.listed.map((note) => note.title);
  assert.ok(!titles.includes(title), `did not expect ${title}, saw ${JSON.stringify(titles)}`);
});

Then('{string} is listed', function (title) {
  const titles = this.listed.map((note) => note.title);
  assert.ok(titles.includes(title), `expected ${title}, saw ${JSON.stringify(titles)}`);
});

When('a visitor with no account opens {string}', async function (title) {
  await this.anonymous('GET', `/public/notes/${noteId(this, title)}`);
});

When('a visitor with no account tries to open {string}', async function (title) {
  await this.anonymous('GET', `/public/notes/${noteId(this, title)}`);
});

Then('the visitor sees its title, text and tags', function () {
  assert.equal(this.lastResponse.status, 200, JSON.stringify(this.lastBody));
  assert.ok(typeof this.lastBody.title === 'string');
  assert.ok(typeof this.lastBody.text === 'string');
  assert.ok(Array.isArray(this.lastBody.tags));
});

Then('the visitor is told the note does not exist', function () {
  assert.equal(this.lastResponse.status, 404, JSON.stringify(this.lastBody));
});

// --- bans hiding published notes -------------------------------------------

When("{word} bans {word}'s account", async function (admin, target) {
  await ensureSignedIn(this, admin);
  const account = this.people.get(target);
  await this.post(admin, `/admin/users/${account.id}/ban`);
});

When("{word} unbans {word}'s account", async function (admin, target) {
  await ensureSignedIn(this, admin);
  const account = this.people.get(target);
  await this.delete(admin, `/admin/users/${account.id}/ban`);
});

Given(
  '{word} is banned and owns a published note titled {string}',
  async function (person, title) {
    await createNote(this, person, title);
    await publishNote(this, person, title);
    await ensureSignedIn(this, ADMIN);
    const account = this.people.get(person);
    const { response } = await this.post(ADMIN, `/admin/users/${account.id}/ban`);
    assert.equal(response.status, 204, JSON.stringify(this.lastBody));
  },
);
