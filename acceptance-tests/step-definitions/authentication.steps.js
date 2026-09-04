import assert from 'node:assert/strict';
import { Given, Then, When } from '@cucumber/cucumber';
import { ADMIN, ensureSignedIn, registerAndSignIn } from '../support/actors.js';
import { API_BASE_URL } from '../support/config.js';
import { startDatabase, stopDatabase } from '../support/database.js';

Given('no one is signed in', function () {
  this.jars.clear();
});

Given('{word} has signed in', async function (person) {
  await registerAndSignIn(this, person);
});

Given('{word} is signed in with a valid session', async function (person) {
  await registerAndSignIn(this, person);
  const { response } = await this.get(person, '/users/me');
  assert.equal(response.status, 200, 'the session should be usable before the ban');
});

Given("{word}'s account is banned", async function (person) {
  const account = await registerAndSignIn(this, person);
  await ensureSignedIn(this, ADMIN);
  const { response } = await this.post(ADMIN, `/admin/users/${account.id}/ban`);
  assert.equal(response.status, 204, JSON.stringify(this.lastBody));
});

// --- signing in -------------------------------------------------------------

When(
  '{word} signs in with the identifier {string} and her password',
  async function (person, identifier) {
    const account = this.people.get(person);
    this.jars.delete(person);
    await this.post(person, '/auth/login', { identifier, password: account.password });
  },
);

When('{word} signs in with her correct password', async function (person) {
  const account = this.people.get(person);
  this.jars.delete(person);
  await this.post(person, '/auth/login', {
    identifier: account.userName,
    password: account.password,
  });
});

When('{word} signs in with her former password', async function (person) {
  const account = this.people.get(person) ?? this.deletedAccount;
  await this.post('__probe__', '/auth/login', {
    identifier: account.userName,
    password: account.password,
  });
});

When('{word} signs in as {string} with a wrong password', async function (person, identifier) {
  await this.post('__probe__', '/auth/login', { identifier, password: 'definitely-wrong' });
  this.wrongPasswordOutcome = { status: this.lastResponse.status, body: this.lastBody };
});

When('someone signs in as {string} with any password', async function (identifier) {
  await this.post('__probe__', '/auth/login', { identifier, password: 'anything-at-all' });
  this.unknownIdentifierOutcome = { status: this.lastResponse.status, body: this.lastBody };
});

Then('she is signed in', function () {
  assert.equal(this.lastResponse.status, 200, JSON.stringify(this.lastBody));
});

Then('both attempts are refused with the same message', function () {
  const wrong = this.wrongPasswordOutcome;
  const unknown = this.unknownIdentifierOutcome;
  assert.equal(wrong.status, unknown.status, 'statuses differ, which enumerates accounts');
  assert.deepEqual(
    wrong.body,
    unknown.body,
    'response bodies differ, which enumerates accounts',
  );
});

Then('sign-in is refused', function () {
  assert.equal(this.lastResponse.status, 401, JSON.stringify(this.lastBody));
});

Then('sign-in is refused because the account is banned', function () {
  assert.equal(this.lastResponse.status, 401, JSON.stringify(this.lastBody));
  assert.equal(this.lastBody.code, 'ACCOUNT_BANNED', JSON.stringify(this.lastBody));
});

Then('{word} cannot sign in', async function (person) {
  const account = this.people.get(person);
  const { response } = await this.post('__probe__', '/auth/login', {
    identifier: account.userName,
    password: account.password,
  });
  assert.ok(response.status >= 400, `expected a refusal, got ${response.status}`);
});

Then('{word} can sign in with her existing password', async function (person) {
  const account = this.people.get(person);
  const { response } = await this.post('__probe2__', '/auth/login', {
    identifier: account.userName,
    password: account.password,
  });
  assert.equal(response.status, 200, JSON.stringify(this.lastBody));
});

// --- sessions ---------------------------------------------------------------

When('the note list is requested', async function () {
  await this.anonymous('GET', '/notes');
});

When('{word} signs out', async function (person) {
  await this.post(person, '/auth/logout');
});

Then('the request is refused as unauthenticated', function () {
  assert.equal(this.lastResponse.status, 401, JSON.stringify(this.lastBody));
});

Then('the request is refused because the account is banned', function () {
  assert.equal(this.lastResponse.status, 403, JSON.stringify(this.lastBody));
  assert.equal(this.lastBody.code, 'ACCOUNT_BANNED', JSON.stringify(this.lastBody));
});

// --- health -----------------------------------------------------------------

Given('the API is running against an initialized database', async function () {
  const response = await fetch(`${API_BASE_URL}/health`);
  assert.ok(response.ok, 'expected the API to be up before the scenario');
});

When('the health of the platform is checked', async function () {
  const response = await fetch(`${API_BASE_URL}/health`);
  this.health = { status: response.status, body: await response.json() };
});

Then('the platform reports itself healthy', function () {
  assert.equal(this.health.status, 200, JSON.stringify(this.health.body));
  assert.equal(this.health.body.status, 'healthy');
});

/**
 * Genuinely takes the database away rather than stubbing the check, then puts
 * it back before the next scenario's reset needs it.
 */
Given('the API is running and the database is unreachable', async function () {
  await stopDatabase();
  this.databaseStopped = true;
});

Then('the platform reports itself unhealthy', async function () {
  const deadline = Date.now() + 20_000;
  let last;
  while (Date.now() < deadline) {
    const response = await fetch(`${API_BASE_URL}/health`);
    last = { status: response.status, body: await response.json() };
    if (last.body.status === 'unhealthy') {
      break;
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  assert.equal(last.body.status, 'unhealthy', JSON.stringify(last));
  assert.equal(last.status, 503, JSON.stringify(last));
});
