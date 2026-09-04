import { PrismaClient, Role } from '@prisma/client';
import * as argon2 from 'argon2';

/**
 * Guarantees the hans.admin administrator exists (platform-foundation).
 *
 * Idempotent by contract: running this against a database that already holds
 * the account must not create a second one and must not alter the existing one.
 * That second half matters - re-seeding must not silently reset a password an
 * operator changed.
 *
 * The default password is for LOCAL DEVELOPMENT ONLY. See the risk recorded in
 * the change design: this platform must not be exposed to anyone until
 * SEED_ADMIN_PASSWORD is set to something else.
 */
export const SEED_ADMIN_USER_NAME = 'hans.admin';
export const SEED_ADMIN_EMAIL = 'hans.admin@example.com';

const prisma = new PrismaClient();

export async function seedAdministrator(client: PrismaClient = prisma): Promise<void> {
  const existing = await client.user.findFirst({
    where: { userName: SEED_ADMIN_USER_NAME, deletedAt: null },
  });

  if (existing) {
    return;
  }

  const password = process.env.SEED_ADMIN_PASSWORD ?? 'p@assw0rt';

  await client.user.create({
    data: {
      firstName: 'Hans',
      lastName: 'Admin',
      email: SEED_ADMIN_EMAIL,
      userName: SEED_ADMIN_USER_NAME,
      passwordHash: await argon2.hash(password, { type: argon2.argon2id }),
      roles: [Role.USER, Role.ADMIN],
    },
  });
}

async function main(): Promise<void> {
  await seedAdministrator();
}

if (require.main === module) {
  main()
    .then(async () => {
      await prisma.$disconnect();
    })
    .catch(async (error: unknown) => {
      console.error(error);
      await prisma.$disconnect();
      process.exit(1);
    });
}
