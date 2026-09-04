import { IsEmail, IsEmpty, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { PASSWORD_MIN_LENGTH } from '@notes/shared';

/**
 * Registration accepts exactly these fields. The global ValidationPipe runs with
 * forbidNonWhitelisted, so a request carrying `roles` is rejected outright
 * rather than silently ignored - a new account can never grant itself ADMIN.
 */
export class RegisterDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  firstName!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  lastName!: string;

  @IsEmail()
  @MaxLength(255)
  email!: string;

  @IsString()
  @Matches(/^[a-zA-Z0-9._-]{3,50}$/, {
    message: 'userName may hold 3 to 50 letters, digits, dot, underscore or hyphen',
  })
  userName!: string;

  @IsString()
  @MinLength(PASSWORD_MIN_LENGTH)
  @MaxLength(200)
  password!: string;
}

export class UpdateProfileDto {
  /**
   * Declared only so it can be refused.
   *
   * The global pipe strips undeclared properties, which would turn an attempt
   * to set `roles` into a silent no-op. Declaring it with @IsEmpty keeps it
   * through whitelisting and then fails validation, so the escalation attempt
   * is answered with 400 rather than ignored.
   */
  @IsEmpty({ message: 'roles cannot be changed through a profile update' })
  roles?: never;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  firstName?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  lastName?: string;

  @IsOptional()
  @IsString()
  @Matches(/^[a-zA-Z0-9._-]{3,50}$/)
  userName?: string;
}
