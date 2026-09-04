import type { CookieOptions, Response } from 'express';
import type { AppConfig } from '../config/env';

export const ACCESS_TOKEN_COOKIE = 'access_token';

function options(config: AppConfig): CookieOptions {
  return {
    httpOnly: true,
    // Lax already withholds the cookie from cross-site non-GET requests, and no
    // state change hides behind a GET (ADR-0002).
    sameSite: 'lax',
    secure: config.cookieSecure,
    path: '/',
  };
}

export function setAccessTokenCookie(response: Response, config: AppConfig, token: string): void {
  response.cookie(ACCESS_TOKEN_COOKIE, token, options(config));
}

export function clearAccessTokenCookie(response: Response, config: AppConfig): void {
  response.clearCookie(ACCESS_TOKEN_COOKIE, options(config));
}
