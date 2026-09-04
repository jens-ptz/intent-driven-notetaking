import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC = 'isPublic';

/**
 * Marks a route as readable without a session.
 *
 * Only the public feed, the health check and the two credential routes carry
 * this; everything else goes through the AuthGuard.
 */
export const Public = (): MethodDecorator & ClassDecorator => SetMetadata(IS_PUBLIC, true);
