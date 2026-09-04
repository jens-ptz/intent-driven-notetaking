import assert from 'node:assert/strict';
import { Given, Then, When } from '@cucumber/cucumber';
import { createNote, ensureSignedIn, listOwnNotes, noteId, publicFeed, publishNote } from '../support/actors.js';
import { db } from '../support/database.js';

function tagNames(note) {
  return note.tags.map((tag) => tag.name);
}

// --- creating tagged notes --------------------------------------------------

When('{word} tags a note with {string}', async function (person, tag) {
  await ensureSignedIn(this, person);
  this.taggedNotes = this.taggedNotes ?? [];
  const { body } = await this.post(person, '/notes', {
    title: `Tagged ${this.taggedNotes.length + 1}`,
    text: 'body',
    tags: [tag],
  });
  this.taggedNotes.push(body);
});

When('{word} tags another note with {string}', async function (person, tag) {
  await ensureSignedIn(this, person);
  this.taggedNotes = this.taggedNotes ?? [];
  const { body } = await this.post(person, '/notes', {
    title: `Tagged ${this.taggedNotes.length + 1}`,
    text: 'body',
    tags: [tag],
  });
  this.taggedNotes.push(body);
});

When('{word} tries to tag a note with {string}', async function (person, tag) {
  await ensureSignedIn(this, person);
  await this.post(person, '/notes', { title: 'Invalid tag', text: 'body', tags: [tag] });
});

When(
  '{word} tries to tag a note with a name of {int} characters',
  async function (person, length) {
    await ensureSignedIn(this, person);
    await this.post(person, '/notes', {
      title: 'Over-long tag',
      text: 'body',
      tags: ['a'.repeat(length)],
    });
  },
);

When('{word} creates a note with no tags', async function (person) {
  const note = await createNote(this, person, 'Untagged');
  this.taggedNotes = [note];
});

Then('both notes carry the tag {string}', function (name) {
  assert.equal(this.taggedNotes.length, 2);
  for (const note of this.taggedNotes) {
    assert.deepEqual(tagNames(note), [name], `expected ${name}, got ${tagNames(note)}`);
  }
});

Then('the platform holds a single tag named {string}', async function (name) {
  const { rows } = await db().query('SELECT count(*)::int AS count FROM tags WHERE name = $1', [
    name,
  ]);
  assert.equal(rows[0].count, 1);
  const { rows: all } = await db().query('SELECT count(*)::int AS count FROM tags');
  assert.equal(all[0].count, 1, 'no other tag should have been created');
});

Then('the note is refused because the tag is invalid', function () {
  assert.equal(this.lastResponse.status, 400, JSON.stringify(this.lastBody));
  assert.equal(this.lastBody.code, 'INVALID_TAG', JSON.stringify(this.lastBody));
});

Then('the note carries no tags', function () {
  assert.deepEqual(tagNames(this.taggedNotes[0]), []);
});

// --- sharing and replacing --------------------------------------------------

Given('{word} owns a note tagged {string}', async function (person, tag) {
  const note = await createNote(this, person, `${person}'s ${tag} note`, { tags: [tag] });
  this.taggedNotes = [...(this.taggedNotes ?? []), note];
});

Given('{word} owns a note tagged {string} and {string}', async function (person, a, b) {
  const note = await createNote(this, person, `${person}'s note`, { tags: [a, b] });
  this.taggedNotes = [note];
});

Given(
  '{word} owns a note tagged {string} and a note tagged {string}',
  async function (person, a, b) {
    await createNote(this, person, `Note about ${a}`, { tags: [a] });
    await createNote(this, person, `Note about ${b}`, { tags: [b] });
  },
);

When('{word} creates a note tagged {string}', async function (person, tag) {
  const note = await createNote(this, person, `${person}'s ${tag} note`, { tags: [tag] });
  this.taggedNotes = [...(this.taggedNotes ?? []), note];
});

Then('both notes reference the same tag', function () {
  const [first, second] = this.taggedNotes;
  assert.equal(first.tags[0].id, second.tags[0].id, 'expected one shared tag row');
});

When('{word} updates the note with the single tag {string}', async function (person, tag) {
  const note = this.taggedNotes[0];
  const { body } = await this.patch(person, `/notes/${note.id}`, { tags: [tag] });
  this.taggedNotes = [body];
});

Then('the note carries only the tag {string}', function (tag) {
  assert.deepEqual(tagNames(this.taggedNotes[0]), [tag]);
});

Given("{string} is the only tag on {word}'s note", async function (tag, person) {
  const note = await createNote(this, person, `${person}'s note`, { tags: [tag] });
  this.taggedNotes = [note];
  this.sharedTagId = note.tags[0].id;
});

When('{word} removes {string} from that note', async function (person, tag) {
  const note = this.taggedNotes[0];
  await this.patch(person, `/notes/${note.id}`, { tags: [] });
});

Then(
  "{word}'s note references the same tag that {word} used",
  async function (person, _other) {
    const notes = await listOwnNotes(this, person);
    const [created] = notes.filter((note) => note.tags.length > 0);
    assert.ok(created, `expected ${person} to own a tagged note`);
    assert.equal(
      created.tags[0].id,
      this.sharedTagId,
      'expected the retained tag row to be reused rather than recreated',
    );
  },
);

// --- filtering --------------------------------------------------------------

When('{word} lists her notes filtered by the tag {string}', async function (person, tag) {
  this.listed = await listOwnNotes(this, person, `?tag=${encodeURIComponent(tag)}`);
});

Then('she sees only the note tagged {string}', function (tag) {
  assert.equal(this.listed.length, 1, `expected one note, got ${this.listed.length}`);
  assert.deepEqual(tagNames(this.listed[0]), [tag]);
});

Then('she sees no notes', function () {
  assert.equal(this.listed.length, 0, `expected nothing, got ${JSON.stringify(this.listed)}`);
});

Given(
  'a published note tagged {string} and a published note tagged {string}',
  async function (a, b) {
    await createNote(this, 'Priya', `Note about ${a}`, { tags: [a] });
    await publishNote(this, 'Priya', `Note about ${a}`);
    await createNote(this, 'Priya', `Note about ${b}`, { tags: [b] });
    await publishNote(this, 'Priya', `Note about ${b}`);
  },
);

When('a visitor browses the public feed filtered by the tag {string}', async function (tag) {
  this.listed = await publicFeed(this, `?tag=${encodeURIComponent(tag)}`);
});

Then('only the note tagged {string} is listed', function (tag) {
  assert.equal(this.listed.length, 1, `expected one note, got ${JSON.stringify(this.listed)}`);
  assert.deepEqual(tagNames(this.listed[0]), [tag]);
});
