import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { ERROR_CODES } from '@notes/shared';
import { UsersRepository } from '../users/users.repository';
import type { AccountContext } from './account-context';
import { ACCESS_TOKEN_COOKIE } from './cookie';
import { IS_PUBLIC } from './public.decorator';

interface AccessTokenClaims {
  sub: number;
}

/**
 * Verifies the access token cookie and reloads the account on every request.
 *
 * The database round trip is the point: it is what makes a ban or an account
 * deletion effective on the very next request rather than at token expiry
 * (ADR-0003).
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwt: JwtService,
    private readonly users: UsersRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<
      Request & { account?: AccountContext; cookies?: Record<string, string> }
    >();

    const token = request.cookies?.[ACCESS_TOKEN_COOKIE];
    if (!token) {
      throw new UnauthorizedException('Authentication required');
    }

    let claims: AccessTokenClaims;
    try {
      claims = await this.jwt.verifyAsync<AccessTokenClaims>(token);
    } catch {
      throw new UnauthorizedException('Authentication required');
    }

    const account = await this.users.findLiveById(claims.sub);
    if (!account) {
      // Deleted mid-session: the cookie is still well-formed but names nobody.
      throw new UnauthorizedException('Authentication required');
    }
    if (account.bannedAt) {
      throw new ForbiddenException({
        statusCode: 403,
        code: ERROR_CODES.ACCOUNT_BANNED,
        message: 'This account is banned',
      });
    }

    request.account = {
      id: account.id,
      email: account.email,
      userName: account.userName,
      roles: account.roles,
    };
    return true;
  }
}
