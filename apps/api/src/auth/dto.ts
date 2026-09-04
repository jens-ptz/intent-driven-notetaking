import { IsString, MinLength } from 'class-validator';

export class LoginDto {
  /** Resolved against both email and user name (authentication spec). */
  @IsString()
  @MinLength(1)
  identifier!: string;

  @IsString()
  @MinLength(1)
  password!: string;
}
