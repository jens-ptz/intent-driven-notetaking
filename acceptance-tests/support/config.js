import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));

export const REPO_ROOT = resolve(here, '..', '..');
export const API_DIR = resolve(REPO_ROOT, 'apps', 'api');
export const WEB_DIR = resolve(REPO_ROOT, 'apps', 'web');

/**
 * The suite runs on its own ports and its own database, so it can never
 * truncate a developer's data or collide with a dev server left running.
 */
export const DB_HOST = process.env.TEST_DB_HOST ?? 'localhost';
export const DB_PORT = Number(process.env.TEST_DB_PORT ?? process.env.DB_PORT ?? 5433);
export const DB_USER = process.env.TEST_DB_USER ?? 'notes';
export const DB_PASSWORD = process.env.TEST_DB_PASSWORD ?? 'notes';
export const DB_NAME = process.env.TEST_DB_NAME ?? 'notes_test';
export const MAINTENANCE_DB = 'postgres';

export const DATABASE_URL = `postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}?schema=public`;
export const MAINTENANCE_URL = `postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${MAINTENANCE_DB}`;

export const API_PORT = Number(process.env.TEST_API_PORT ?? 3210);
export const WEB_PORT = Number(process.env.TEST_WEB_PORT ?? 5274);
export const API_BASE_URL = `http://localhost:${API_PORT}/api/v1`;
export const WEB_BASE_URL = `http://localhost:${WEB_PORT}`;

export const JWT_SECRET = 'acceptance-suite-secret';
export const SEED_ADMIN_PASSWORD = 'p@assw0rt';
export const SEED_ADMIN_USER_NAME = 'hans.admin';
export const SEED_ADMIN_EMAIL = 'hans.admin@example.com';

/** Environment handed to the API child process. */
export function apiEnv() {
  return {
    ...process.env,
    DATABASE_URL,
    API_PORT: String(API_PORT),
    WEB_ORIGIN: WEB_BASE_URL,
    JWT_SECRET,
    JWT_EXPIRES_IN: '1h',
    COOKIE_SECURE: '',
    SEED_ADMIN_PASSWORD,
  };
}
