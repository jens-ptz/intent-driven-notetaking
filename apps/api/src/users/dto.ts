import { IsEmail, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';
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
