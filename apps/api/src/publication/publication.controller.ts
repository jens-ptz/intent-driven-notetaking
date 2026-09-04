import { Controller, Delete, HttpCode, HttpStatus, Param, ParseIntPipe, Post } from '@nestjs/common';
import { Role } from '@prisma/client';
import type { NoteView } from '@notes/shared';
import type { AccountContext } from '../auth/account-context';
import { CurrentUser } from '../common/current-user.decorator';
import { PublicationService } from './publication.service';

/** Owner-facing publication actions; the administrator side lives in AdminController. */
@Controller('notes/:id')
export class NotePublicationController {
  constructor(private readonly publication: PublicationService) {}

  @Post('publication-request')
  @HttpCode(HttpStatus.OK)
  request(
    @CurrentUser() account: AccountContext,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<NoteView> {
    return this.publication.request(id, account.id);
  }

  @Delete('publication')
  @HttpCode(HttpStatus.OK)
  withdraw(
    @CurrentUser() account: AccountContext,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<NoteView> {
    return this.publication.withdraw(id, {
      id: account.id,
      isAdmin: account.roles.includes(Role.ADMIN),
    });
  }
}
