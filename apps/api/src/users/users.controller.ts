import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Patch, Post } from '@nestjs/common';
import type { UserProfile } from '@notes/shared';
import type { AccountContext } from '../auth/account-context';
import { Public } from '../auth/public.decorator';
import { CurrentUser } from '../common/current-user.decorator';
import { RegisterDto, UpdateProfileDto } from './dto';
import { UsersRepository } from './users.repository';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(
    private readonly service: UsersService,
    private readonly users: UsersRepository,
  ) {}

  @Public()
  @Post('register')
  register(@Body() dto: RegisterDto): Promise<UserProfile> {
    return this.service.register(dto);
  }

  @Get('me')
  async me(@CurrentUser() account: AccountContext): Promise<UserProfile> {
    const user = await this.users.findLiveById(account.id);
    return UsersService.toProfile(user!);
  }

  @Patch('me')
  updateMe(
    @CurrentUser() account: AccountContext,
    @Body() dto: UpdateProfileDto,
  ): Promise<UserProfile> {
    return this.service.updateProfile(account.id, dto);
  }

  @Delete('me')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteMe(@CurrentUser() account: AccountContext): Promise<void> {
    return this.service.deleteOwnAccount(account.id);
  }
}
