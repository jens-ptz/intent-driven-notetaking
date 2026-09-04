/**
 * Environment configuration, read once at boot and validated loudly.
 *
 * A missing JWT secret must stop the process rather than fall back to a
 * default, so no deployment can ever sign sessions with a well-known key.
 */
export interface AppConfig {
  port: number;
  databaseUrl: string;
  webOrigin: string;
  jwtSecret: string;
  jwtExpiresIn: string;
  cookieSecure: boolean;
}

function required(name: string): string {
  const value = process.env[name];
  if (value === undefined || value.trim() === '') {
    throw new Error(`Missing required environment variable ${name}`);
  }
  return value;
}

export function loadConfig(): AppConfig {
  return {
    port: Number(process.env.API_PORT ?? 3000),
    databaseUrl: required('DATABASE_URL'),
    webOrigin: process.env.WEB_ORIGIN ?? 'http://localhost:5273',
    jwtSecret: required('JWT_SECRET'),
    jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '1h',
    cookieSecure: process.env.COOKIE_SECURE === '1',
  };
}

export const APP_CONFIG = 'APP_CONFIG';
