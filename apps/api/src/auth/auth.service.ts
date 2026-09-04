import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { ERROR_CODES } from '@notes/shared';
import { UsersRepository } from '../users/users.repository';

/** Hashing lives here so registration and sign-in cannot drift apart. */
@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersRepository,
    private readonly jwt: JwtService,
  ) {}

  hashPassword(password: string): Promise<string> {
    return argon2.hash(password, { type: argon2.argon2id });
  }

  /**
   * Returns a signed access token, or throws.
   *
   * An unknown identifier and a wrong password produce the identical failure,
   * so sign-in cannot be used to discover which accounts exist. The dummy
   * verify on the unknown-identifier path keeps the timing comparable too.
   */
  async signIn(identifier: string, password: string): Promise<string> {
    const account = await this.users.findLiveByIdentifier(identifier);

    if (!account) {
      await argon2.verify(
        '$argon2id$v=19$m=65536,t=3,p=4$c29tZXNhbHRzb21lc2FsdA$5Xh8Y0zP8vY4hZ7Yq0kX0pYQ2vHqYQ4nR7wV8Y1lS0M',
        password,
      ).catch(() => false);
      throw this.invalidCredentials();
    }

    const correct = await argon2.verify(account.passwordHash, password).catch(() => false);
    if (!correct) {
      throw this.invalidCredentials();
    }

    // A banned account is refused distinctly: the person already knows the
    // account exists, and hiding the ban would just look like a broken password.
    if (account.bannedAt) {
      throw new UnauthorizedException({
        statusCode: 401,
        code: ERROR_CODES.ACCOUNT_BANNED,
        message: 'This account is banned',
      });
    }

    return this.jwt.signAsync({ sub: account.id });
  }

  private invalidCredentials(): UnauthorizedException {
    return new UnauthorizedException({
      statusCode: 401,
      code: ERROR_CODES.INVALID_CREDENTIALS,
      message: 'Invalid credentials',
    });
  }
}
