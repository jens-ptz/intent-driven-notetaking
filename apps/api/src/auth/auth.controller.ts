import { Body, Controller, HttpCode, HttpStatus, Inject, Post, Res } from '@nestjs/common';
import type { Response } from 'express';
import { APP_CONFIG, type AppConfig } from '../config/env';
import { AuthService } from './auth.service';
import { clearAccessTokenCookie, setAccessTokenCookie } from './cookie';
import { LoginDto } from './dto';
import { Public } from './public.decorator';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    @Inject(APP_CONFIG) private readonly config: AppConfig,
  ) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<{ status: string }> {
    const token = await this.auth.signIn(dto.identifier, dto.password);
    setAccessTokenCookie(response, this.config, token);
    return { status: 'signed-in' };
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(@Res({ passthrough: true }) response: Response): { status: string } {
    clearAccessTokenCookie(response, this.config);
    return { status: 'signed-out' };
  }
}
