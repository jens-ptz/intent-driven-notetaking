import { ExecutionContext, createParamDecorator } from '@nestjs/common';
import type { Request } from 'express';
import type { AccountContext } from '../auth/account-context';

/** The account the AuthGuard loaded for this request. */
export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AccountContext => {
    const request = context.switchToHttp().getRequest<Request & { account?: AccountContext }>();
    if (!request.account) {
      throw new Error('CurrentUser used on a route that is not behind the AuthGuard');
    }
    return request.account;
  },
);
