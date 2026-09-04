import assert from 'node:assert/strict';
import { Given, Then, When } from '@cucumber/cucumber';
import { db, runRealSeed, seedAdminPassword, truncateAll } from '../support/database.js';

Given('an empty platform database', async function () {
  // The default per-scenario state includes the administrator; this scenario is
  // specifically about initializing from nothing.
  await truncateAll();
});

Given('an initialized platform holding the seed administrator', async function () {
  const { rows } = await db().query(
    'SELECT count(*)::int AS count FROM users WHERE user_name = $1',
    ['hans.admin'],
  );
  assert.equal(rows[0].count, 1, 'expected the seed administrator to be present');
});

Given('an initialized platform', async function () {
  const { rows } = await db().query('SELECT count(*)::int AS count FROM users');
  assert.ok(rows[0].count >= 1, 'expected an initialized platform');
});

When('the platform is initialized', async function () {
  await runRealSeed();
});

When('the platform is initialized again', async function () {
  await runRealSeed();
});

Then('an administrator account named {string} exists', async function (userName) {
  const { rows } = await db().query(
    'SELECT roles FROM users WHERE user_name = $1 AND deleted_at IS NULL',
    [userName],
  );
  assert.equal(rows.length, 1, `expected exactly one live account named ${userName}`);
  this.lastSeededRoles = rows[0].roles;
});

Then('exactly one account named {string} exists', async function (userName) {
  const { rows } = await db().query(
    'SELECT count(*)::int AS count FROM users WHERE user_name = $1',
    [userName],
  );
  assert.equal(rows[0].count, 1);
});

Then('that account holds the admin role', function () {
  assert.ok(
    this.lastSeededRoles.includes('ADMIN'),
    `expected the admin role, got ${this.lastSeededRoles}`,
  );
});

When(
  'Hans signs in as {string} with the password {string}',
  async function (identifier, password) {
    await this.post('Hans', '/auth/login', { identifier, password });
  },
);

Then('he is signed in as an administrator', async function () {
  assert.equal(this.lastResponse.status, 200, JSON.stringify(this.lastBody));
  const { body } = await this.get('Hans', '/users/me');
  assert.equal(this.lastResponse.status, 200, JSON.stringify(body));
  assert.ok(body.roles.includes('ADMIN'), `expected admin roles, got ${body.roles}`);
});

export { seedAdminPassword };
