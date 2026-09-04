import { ConflictException, Injectable } from '@nestjs/common';
import { Role, User } from '@prisma/client';
import { ERROR_CODES, type UserProfile } from '@notes/shared';
import { AuthService } from '../auth/auth.service';
import type { RegisterDto, UpdateProfileDto } from './dto';
import { UsersRepository } from './users.repository';

@Injectable()
export class UsersService {
  constructor(
    private readonly users: UsersRepository,
    private readonly auth: AuthService,
  ) {}

  /** Never returns the password hash; callers get this shape or nothing. */
  static toProfile(user: User): UserProfile {
    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      userName: user.userName,
      roles: user.roles,
    };
  }

  async register(dto: RegisterDto): Promise<UserProfile> {
    // Checked before insert so the caller gets a precise code; the partial
    // unique indexes remain the actual guarantee under concurrency.
    if (await this.users.findLiveByEmail(dto.email)) {
      throw new ConflictException({
        statusCode: 409,
        code: ERROR_CODES.EMAIL_TAKEN,
        message: 'That email is already taken',
      });
    }
    if (await this.users.findLiveByUserName(dto.userName)) {
      throw new ConflictException({
        statusCode: 409,
        code: ERROR_CODES.USER_NAME_TAKEN,
        message: 'That user name is already taken',
      });
    }

    const created = await this.users.create({
      firstName: dto.firstName,
      lastName: dto.lastName,
      email: dto.email,
      userName: dto.userName,
      passwordHash: await this.auth.hashPassword(dto.password),
      roles: [Role.USER],
    });

    return UsersService.toProfile(created);
  }

  async updateProfile(id: number, dto: UpdateProfileDto): Promise<UserProfile> {
    if (dto.userName !== undefined) {
      const holder = await this.users.findLiveByUserName(dto.userName);
      if (holder && holder.id !== id) {
        throw new ConflictException({
          statusCode: 409,
          code: ERROR_CODES.USER_NAME_TAKEN,
          message: 'That user name is already taken',
        });
      }
    }
    // roles is not in UpdateProfileDto, so no profile update can change it.
    return UsersService.toProfile(await this.users.update(id, dto));
  }

  async deleteOwnAccount(id: number): Promise<void> {
    await this.users.softDeleteWithNotes(id);
  }
}
