import { SetMetadata } from '@nestjs/common';
import type { Role } from '@prisma/client';

export const REQUIRED_ROLES = 'requiredRoles';

export const RequireRoles = (...roles: Role[]) => SetMetadata(REQUIRED_ROLES, roles);
