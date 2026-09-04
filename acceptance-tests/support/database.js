import pg from 'pg';
import {
  API_DIR,
  DATABASE_URL,
  DB_NAME,
  MAINTENANCE_URL,
  SEED_ADMIN_EMAIL,
  SEED_ADMIN_PASSWORD,
  SEED_ADMIN_USER_NAME,
  apiEnv,
} from './config.js';
import { exec } from './processes.js';

const { Client, Pool } = pg;

let pool;
/**
 * The seed administrator's password hash, computed once for the whole run.
 *
 * Per-scenario reset inserts this row with plain SQL because hashing with
 * argon2 93 times would dominate the suite's runtime. The real seed script is
 * still exercised for real by the platform-foundation scenarios, which invoke
 * it as their "the platform is initialized" step.
 */
let adminPasswordHash;

export function db() {
  if (!pool) {
    pool = new Pool({ connectionString: DATABASE_URL });
  }
  return pool;
}

/** Creates the dedicated test database if it is not there yet. */
export async function ensureDatabase() {
  const client = new Client({ connectionString: MAINTENANCE_URL });
  await client.connect();
  try {
    const { rowCount } = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [
      DB_NAME,
    ]);
    if (rowCount === 0) {
      await client.query(`CREATE DATABASE "${DB_NAME}"`);
    }
  } finally {
    await client.end();
  }
}

export async function migrate() {
  await exec('npx', ['prisma', 'migrate', 'deploy'], {
    cwd: API_DIR,
    env: { ...apiEnv(), DATABASE_URL },
  });
}

/** Runs the application's real seed script against the test database. */
export async function runRealSeed() {
  await exec('npx', ['tsx', 'prisma/seed.ts'], {
    cwd: API_DIR,
    env: { ...apiEnv(), DATABASE_URL },
  });
}

export async function captureAdminPasswordHash() {
  await runRealSeed();
  const { rows } = await db().query('SELECT password_hash FROM users WHERE user_name = $1', [
    SEED_ADMIN_USER_NAME,
  ]);
  adminPasswordHash = rows[0].password_hash;
}

export async function truncateAll() {
  await db().query(
    'TRUNCATE TABLE note_tags, notes, tags, users RESTART IDENTITY CASCADE',
  );
}

export async function insertSeedAdministrator() {
  await db().query(
    `INSERT INTO users (first_name, last_name, email, user_name, password_hash, roles, created_at, updated_at)
     VALUES ('Hans', 'Admin', $1, $2, $3, ARRAY['USER','ADMIN']::"Role"[], now(), now())`,
    [SEED_ADMIN_EMAIL, SEED_ADMIN_USER_NAME, adminPasswordHash],
  );
}

/** The state every scenario starts from: empty, plus the guaranteed administrator. */
export async function resetToSeededState() {
  await truncateAll();
  await insertSeedAdministrator();
}

export const seedAdminPassword = SEED_ADMIN_PASSWORD;

export async function closeDatabase() {
  if (pool) {
    await pool.end();
    pool = undefined;
  }
}
