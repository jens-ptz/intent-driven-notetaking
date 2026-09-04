import assert from 'node:assert/strict';
import { Given, Then, When } from '@cucumber/cucumber';
import { ADMIN, createNote, ensureSignedIn, noteId, publishNote } from '../support/actors.js';
import { browserPages, signInBrowser, signOutBrowser } from '../support/browser-session.js';

const SCRIPT_PAYLOAD =
  'Innocent opening.\n\n<script>window.__pwned = true;</script>\n\n<img src=x onerror="window.__pwned = true">';

/** Gherkin carries "\n" literally; author intent is a line break. */
function unescape(text) {
  return text.replace(/\\n/g, '\n');
}

// --- fixtures ---------------------------------------------------------------

Given('{word} owns a published note whose text is {string}', async function (person, text) {
  await createNote(this, person, 'Rendered note', { text: unescape(text) });
  await publishNote(this, person, 'Rendered note');
});

Given(
  '{word} owns a published note whose text contains an embedded script tag',
  async function (person) {
    await createNote(this, person, 'Hostile note', { text: SCRIPT_PAYLOAD });
    await publishNote(this, person, 'Hostile note');
  },
);

Given(
  '{word} owns a private note titled {string} and a published note titled {string}',
  async function (person, privateTitle, publishedTitle) {
    await createNote(this, person, privateTitle);
    await createNote(this, person, publishedTitle);
    await publishNote(this, person, publishedTitle);
  },
);

Given('{word} is editing a note', async function (person) {
  await createNote(this, person, 'Draft note');
  await signInBrowser(this, person);
  const { editor } = await browserPages(this);
  await editor.openById(noteId(this, 'Draft note'));
});

Given(
  "{word} rejected {word}'s note {string} with the reason {string}",
  async function (admin, owner, title, reason) {
    await createNote(this, owner, title);
    const requested = await this.post(owner, `/notes/${noteId(this, title)}/publication-request`);
    assert.equal(requested.response.status, 200, JSON.stringify(requested.body));
    await ensureSignedIn(this, admin);
    const rejected = await this.post(admin, `/admin/notes/${noteId(this, title)}/reject`, {
      reason,
    });
    assert.equal(rejected.response.status, 200, JSON.stringify(rejected.body));
  },
);

// --- the anonymous feed -----------------------------------------------------

When('a visitor with no account opens the landing page', async function () {
  const { feed } = await browserPages(this);
  await signOutBrowser(this);
  await feed.open();
  this.feedTitles = await feed.titles();
});

Then('{string} is shown in the public feed', async function (title) {
  const { feed } = await browserPages(this);
  // An administrator arriving from the moderation queue is not on the feed yet.
  if (!(await this.page.getByTestId('public-feed').isVisible())) {
    await feed.open();
  }
  const titles = await feed.titles();
  assert.ok(titles.includes(title), `expected ${title}, the feed showed ${JSON.stringify(titles)}`);
});

When('a visitor opens that note', async function () {
  const { publicNote } = await browserPages(this);
  await signOutBrowser(this);
  const title = this.notes.has('Hostile note') ? 'Hostile note' : 'Rendered note';
  await publicNote.openById(noteId(this, title));
});

Then('{string} is shown as a heading', async function (text) {
  const { publicNote } = await browserPages(this);
  assert.equal((await publicNote.headingText(1))?.trim(), text);
});

Then('{string} is shown in italics', async function (text) {
  const { publicNote } = await browserPages(this);
  assert.equal((await publicNote.italicText())?.trim(), text);
});

Then('the script does not run', async function () {
  const pwned = await this.page.evaluate(() => window.__pwned);
  assert.equal(pwned, undefined, 'author-supplied script executed in the visitor browser');
});

Then('its markup is not added to the page', async function () {
  const { publicNote } = await browserPages(this);
  const html = await publicNote.markdownHtml();
  assert.ok(!/<script/i.test(html), `script markup reached the page: ${html}`);
  assert.ok(!/onerror=/i.test(html), `an event handler reached the page: ${html}`);
});

// --- registering and signing in --------------------------------------------

When('{word} completes the registration form with valid details', async function (person) {
  const { register } = await browserPages(this);
  await signOutBrowser(this);
  await register.open();
  this.browserCredentials = {
    firstName: person,
    lastName: 'Tester',
    email: `${person.toLowerCase()}@example.com`,
    userName: person.toLowerCase(),
    password: 'correct-horse-1',
  };
  await register.submit(this.browserCredentials);
});

When('{word} submits the sign-in form with a wrong password', async function (person) {
  const { signIn } = await browserPages(this);
  await signOutBrowser(this);
  await signIn.open();
  await signIn.submit(person.toLowerCase(), 'definitely-not-it');
});

Then('she is shown a sign-in error', async function () {
  const { signIn } = await browserPages(this);
  await signIn.error().waitFor();
  assert.ok(await signIn.error().isVisible());
});

Then('she is not signed in', async function () {
  const { noteList } = await browserPages(this);
  assert.equal(await noteList.isOffered(), false, 'the signed-in navigation is showing');
});

Then('her note list is shown', async function () {
  const { noteList } = await browserPages(this);
  await this.page.getByTestId('note-list').waitFor();
  assert.ok(await noteList.isOffered());
});

// --- signing out ------------------------------------------------------------

Then('the public feed is shown', async function () {
  await this.page.getByTestId('public-feed').waitFor();
});

Then('no note list is offered', async function () {
  // Signing out refetches the session; wait for the navigation to settle on
  // visible state rather than reading it mid-transition.
  await this.page.getByTestId('nav-login').waitFor();
  await this.page.getByTestId('nav-my-notes').waitFor({ state: 'detached' });
  const { noteList } = await browserPages(this);
  assert.equal(await noteList.isOffered(), false);
});

// --- the note list ----------------------------------------------------------

When('{word} opens her note list', async function (person) {
  await signInBrowser(this, person);
  const { noteList } = await browserPages(this);
  await noteList.open();
});

Then('{string} is shown as private', async function (title) {
  const { noteList } = await browserPages(this);
  assert.match(await noteList.stateOf(title), /private/);
});

Then('{string} is shown as published', async function (title) {
  const { noteList } = await browserPages(this);
  assert.match(await noteList.stateOf(title), /published/);
});

When('{word} deletes it from her note list', async function (person) {
  await signInBrowser(this, person);
  const { noteList } = await browserPages(this);
  await noteList.open();
  const [title] = [...this.notes.keys()].slice(-1);
  await noteList.delete(title);
});

Then('{string} is no longer listed', async function (title) {
  const { noteList } = await browserPages(this);
  const titles = await noteList.titles();
  assert.ok(!titles.includes(title), `still listed: ${JSON.stringify(titles)}`);
});

// --- the editor -------------------------------------------------------------

When('{word} types {string} into the editor', async function (_person, text) {
  const { editor } = await browserPages(this);
  await editor.typeBody(unescape(text));
});

Then('the preview shows {string} as a heading', async function (text) {
  const { editor } = await browserPages(this);
  const heading = editor.previewHeading(1);
  await heading.waitFor();
  assert.equal((await heading.textContent())?.trim(), text);
});

When('{word} enters the tags {string} and {string}', async function (_person, first, second) {
  const { editor } = await browserPages(this);
  await editor.setTags([first, second]);
});

When('{word} saves the note', async function (_person) {
  const { editor } = await browserPages(this);
  await editor.save();
});

Then('the note is shown with the tags {string} and {string}', async function (first, second) {
  const { editor } = await browserPages(this);
  await this.page
    .locator(`[data-testid="editor-tag"]:text-is("${first}")`)
    .waitFor();
  const shown = await editor.tags();
  assert.deepEqual([...shown].sort(), [first, second].sort());
});

When('{word} requests publication from the editor', async function (person) {
  await signInBrowser(this, person);
  const { editor } = await browserPages(this);
  const [title] = [...this.notes.keys()].slice(-1);
  await editor.openById(noteId(this, title));
  await editor.requestPublication();
});

Then('the note is shown as pending publication', async function () {
  const { editor } = await browserPages(this);
  assert.match(await editor.state().textContent(), /pending/);
});

When('{word} opens that note', async function (person) {
  await signInBrowser(this, person);
  const { editor } = await browserPages(this);
  const [title] = [...this.notes.keys()].slice(-1);
  await editor.openById(noteId(this, title));
});

Then('she is shown the rejection reason {string}', async function (reason) {
  const { editor } = await browserPages(this);
  await editor.rejectionReason().waitFor();
  assert.match(await editor.rejectionReason().textContent(), new RegExp(reason));
});

// --- the admin area ---------------------------------------------------------

When('{word} opens the moderation queue and approves {string}', async function (person, title) {
  await signInBrowser(this, person);
  const { admin } = await browserPages(this);
  await admin.openModeration();
  await admin.approve(title);
});

When('{word} bans {word} from the account list', async function (admin, target) {
  await signInBrowser(this, admin);
  const pages = await browserPages(this);
  await pages.admin.openUsers();
  await pages.admin.ban(this.people.get(target).userName);
});

Then('{word} is shown as banned in the account list', async function (target) {
  const { admin } = await browserPages(this);
  assert.match(await admin.stateOf(this.people.get(target).userName), /banned/);
});

When('{word} navigates to the administration area', async function (person) {
  await signInBrowser(this, person);
  const { admin } = await browserPages(this);
  await admin.goto('/admin/moderation');
});

Then('she is refused access', async function () {
  const { admin } = await browserPages(this);
  await admin.forbidden().waitFor();
  assert.ok(await admin.forbidden().isVisible());
});

Then('no administration navigation is offered to her', async function () {
  const { admin } = await browserPages(this);
  assert.equal(await admin.navigation().isVisible(), false);
});
