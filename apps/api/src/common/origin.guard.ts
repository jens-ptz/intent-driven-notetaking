import { CanActivate, ExecutionContext, ForbiddenException, Inject, Injectable } from '@nestjs/common';
import type { Request } from 'express';
import { APP_CONFIG, type AppConfig } from '../config/env';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * Defence in depth against CSRF (ADR-0002).
 *
 * SameSite=Lax already withholds the session cookie from cross-site non-GET
 * requests. This refuses a mutating request whose Origin is not the configured
 * web origin, so a browser that mishandles SameSite does not become a hole.
 * Requests with no Origin at all are allowed: non-browser clients such as curl
 * send none, and they carry no ambient cookie to abuse.
 */
@Injectable()
export class OriginGuard implements CanActivate {
  constructor(@Inject(APP_CONFIG) private readonly config: AppConfig) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();

    if (SAFE_METHODS.has(request.method)) {
      return true;
    }

    const origin = request.headers.origin;
    if (origin === undefined || origin === this.config.webOrigin) {
      return true;
    }

    throw new ForbiddenException('Cross-origin request refused');
  }
}
