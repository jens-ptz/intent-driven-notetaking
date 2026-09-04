import assert from 'node:assert/strict';
import { Given, Then, When } from '@cucumber/cucumber';
import { registerAndSignIn } from '../support/actors.js';
import { db } from '../support/database.js';

const DEFAULT_PASSWORD = 'correct-horse-1';

function details(person, overrides = {}) {
  const handle = person.toLowerCase();
  return {
    firstName: person,
    lastName: 'Tester',
    email: `${handle}@example.com`,
    userName: handle,
    password: DEFAULT_PASSWORD,
    ...overrides,
  };
}

// --- preconditions ----------------------------------------------------------

Given('no account uses the email {string}', async function (email) {
  const { rows } = await db().query(
    'SELECT count(*)::int AS count FROM users WHERE email = $1 AND deleted_at IS NULL',
    [email],
  );
  assert.equal(rows[0].count, 0);
});

Given('a live account uses the email {string}', async function (email) {
  await registerAndSignIn(this, 'Priya', { email });
});

Given('a live account uses the user name {string}', async function (userName) {
  await registerAndSignIn(this, 'Priya', { userName });
});

Given('{word} holds a live account', async function (person) {
  await registerAndSignIn(this, person);
});

Given('{word} holds an account', async function (person) {
  await registerAndSignIn(this, person);
});

Given(
  '{word} holds an account with the email {string} and the user name {string}',
  async function (person, email, userName) {
    await registerAndSignIn(this, person, { email, userName });
  },
);

Given('{word} holds an account with the user name {string}', async function (person, userName) {
  await registerAndSignIn(this, person, { userName });
});

Given('{word} is signed in and holds the user role only', async function (person) {
  const account = await registerAndSignIn(this, person);
  const { body } = await this.get(person, '/users/me');
  assert.deepEqual(body.roles, ['USER']);
  return account;
});

// --- registering ------------------------------------------------------------

When('{word} registers as {string} with the email {string}', async function (person, userName, email) {
  await this.post(person, '/users/register', details(person, { userName, email }));
});

When('{word} registers with the email {string}', async function (person, email) {
  const account = details(person, { email });
  const { response, body } = await this.post(person, '/users/register', account);
  // Keep the registration outcome for the Then steps; signing in below would
  // otherwise overwrite lastResponse with the login result.
  this.registration = { status: response.status, body };
  if (response.status === 201) {
    await this.post(person, '/auth/login', {
      identifier: account.userName,
      password: account.password,
    });
    this.people.set(person, { ...account, id: body.id });
  }
});

When(
  '{word} registers with the email {string} and asks for the admin role',
  async function (person, email) {
    // Sent as a bare object so the extra property reaches the API exactly as a
    // hostile client would send it.
    await this.post(person, '/users/register', {
      ...details(person, { email }),
      roles: ['USER', 'ADMIN'],
    });
  },
);

When('{word} tries to register with the email {string}', async function (person, email) {
  await this.post(person, '/users/register', details(person, { email }));
});

When('{word} tries to register as {string}', async function (person, userName) {
  await this.post(person, '/users/register', details(person, { userName }));
});

When(
  '{word} tries to register with the email {string} and the password {string}',
  async function (person, email, password) {
    await this.post(person, '/users/register', details(person, { email, password }));
  },
);

Then('her account exists', async function () {
  assert.equal(this.lastResponse.status, 201, JSON.stringify(this.lastBody));
});

Then('his account is created', function () {
  const outcome = this.registration ?? { status: this.lastResponse.status, body: this.lastBody };
  assert.equal(outcome.status, 201, JSON.stringify(outcome.body));
});

Then('she holds the user role only', function () {
  assert.deepEqual(this.lastBody.roles, ['USER'], JSON.stringify(this.lastBody));
});

Then('his account holds the user role only', function () {
  const outcome = this.registration ?? { status: this.lastResponse.status, body: this.lastBody };
  assert.equal(outcome.status, 201, JSON.stringify(outcome.body));
  assert.deepEqual(outcome.body.roles, ['USER'], JSON.stringify(outcome.body));
});

Then('registration is refused because the email is taken', function () {
  assert.equal(this.lastResponse.status, 409, JSON.stringify(this.lastBody));
  assert.equal(this.lastBody.code, 'EMAIL_TAKEN');
});

Then('registration is refused because the user name is taken', function () {
  assert.equal(this.lastResponse.status, 409, JSON.stringify(this.lastBody));
  assert.equal(this.lastBody.code, 'USER_NAME_TAKEN');
});

Then('registration is refused because the details are invalid', function () {
  assert.equal(this.lastResponse.status, 400, JSON.stringify(this.lastBody));
});

Then('no account is created for her', async function () {
  const { rows } = await db().query(
    "SELECT count(*)::int AS count FROM users WHERE user_name = 'priya'",
  );
  assert.equal(rows[0].count, 0);
});

Then('his note list is empty', async function () {
  const { body } = await this.get('Marek', '/notes');
  assert.deepEqual(body.items, [], JSON.stringify(body));
});

// --- profile ----------------------------------------------------------------

When('{word} views her profile', async function (person) {
  await this.get(person, '/users/me');
});

Then('she sees her first name, last name, email and user name', function () {
  const body = this.lastBody;
  for (const field of ['firstName', 'lastName', 'email', 'userName']) {
    assert.ok(typeof body[field] === 'string', `expected ${field}`);
  }
});

Then('no password material is shown', function () {
  const serialized = JSON.stringify(this.lastBody);
  assert.ok(!/password|hash|argon/i.test(serialized), `leaked credential material: ${serialized}`);
});

When('{word} changes her last name to {string}', async function (person, lastName) {
  await this.patch(person, '/users/me', { lastName });
});

Then('her profile shows the last name {string}', async function (lastName) {
  const { body } = await this.get('Priya', '/users/me');
  assert.equal(body.lastName, lastName);
});

When('{word} tries to give herself the admin role', async function (person) {
  await this.patch(person, '/users/me', { roles: ['USER', 'ADMIN'] });
});

Then('she still holds the user role only', async function () {
  const { body } = await this.get('Priya', '/users/me');
  assert.deepEqual(body.roles, ['USER'], JSON.stringify(body));
});

// --- self-deletion ----------------------------------------------------------

When('{word} deletes her account', async function (person) {
  const { response } = await this.delete(person, '/users/me');
  assert.equal(response.status, 204, JSON.stringify(this.lastBody));
});

Given('{word} has deleted her account', async function (person) {
  const account = await registerAndSignIn(this, person);
  const { response } = await this.delete(person, '/users/me');
  assert.equal(response.status, 204);
  this.deletedAccount = account;
});

Given(
  '{word} has deleted her account which used the email {string}',
  async function (person, email) {
    const account = await registerAndSignIn(this, person, { email });
    const { response } = await this.delete(person, '/users/me');
    assert.equal(response.status, 204);
    this.deletedAccount = account;
  },
);

Then('she can no longer sign in with her former credentials', async function () {
  const account = this.people.get('Priya') ?? this.deletedAccount;
  const { response } = await this.post('__probe__', '/auth/login', {
    identifier: account.userName,
    password: account.password,
  });
  assert.equal(response.status, 401, JSON.stringify(this.lastBody));
});
