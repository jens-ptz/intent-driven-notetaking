import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Role } from '@prisma/client';
import type { Request } from 'express';
import type { AccountContext } from './account-context';
import { REQUIRED_ROLES } from './roles.decorator';

/**
 * Runs after the AuthGuard, so `request.account` is the freshly loaded row
 * rather than whatever the token claimed when it was issued.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<Role[] | undefined>(REQUIRED_ROLES, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required || required.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request & { account?: AccountContext }>();
    const roles = request.account?.roles ?? [];

    if (!required.every((role) => roles.includes(role))) {
      throw new ForbiddenException('This operation requires the admin role');
    }
    return true;
  }
}
