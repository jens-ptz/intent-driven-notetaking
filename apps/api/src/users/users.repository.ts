import { Injectable } from '@nestjs/common';
import { Prisma, Role, User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Every read here states `deletedAt: null` explicitly. There is no global
 * soft-delete filter, so a query always says which rows it means (ADR-0004).
 */
@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  findLiveById(id: number): Promise<User | null> {
    return this.prisma.user.findFirst({ where: { id, deletedAt: null } });
  }

  /** Resolves a sign-in identifier against both email and user name. */
  findLiveByIdentifier(identifier: string): Promise<User | null> {
    return this.prisma.user.findFirst({
      where: {
        deletedAt: null,
        OR: [{ email: identifier }, { userName: identifier }],
      },
    });
  }

  findLiveByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findFirst({ where: { email, deletedAt: null } });
  }

  findLiveByUserName(userName: string): Promise<User | null> {
    return this.prisma.user.findFirst({ where: { userName, deletedAt: null } });
  }

  create(data: Prisma.UserCreateInput): Promise<User> {
    return this.prisma.user.create({ data });
  }

  update(id: number, data: Prisma.UserUpdateInput): Promise<User> {
    return this.prisma.user.update({ where: { id }, data });
  }

  listLive(skip: number, take: number): Promise<[User[], number]> {
    return this.prisma.$transaction([
      this.prisma.user.findMany({
        where: { deletedAt: null },
        orderBy: { id: 'asc' },
        skip,
        take,
      }),
      this.prisma.user.count({ where: { deletedAt: null } }),
    ]);
  }

  /**
   * Soft-deletes an account and, in the same transaction, every note it owns -
   * published ones included, so they leave the public feed at the same instant
   * the account does.
   */
  async softDeleteWithNotes(id: number): Promise<void> {
    const deletedAt = new Date();
    await this.prisma.$transaction([
      this.prisma.note.updateMany({
        where: { ownerId: id, deletedAt: null },
        data: { deletedAt },
      }),
      this.prisma.user.update({ where: { id }, data: { deletedAt } }),
    ]);
  }

  hasRole(user: Pick<User, 'roles'>, role: Role): boolean {
    return user.roles.includes(role);
  }
}
