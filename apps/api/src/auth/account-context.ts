import type { Role } from '@prisma/client';

/** The freshly loaded account the guard attaches to every authenticated request. */
export interface AccountContext {
  id: number;
  email: string;
  userName: string;
  roles: Role[];
}
