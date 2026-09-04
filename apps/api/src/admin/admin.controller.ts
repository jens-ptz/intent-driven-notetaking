import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import {
  DEFAULT_PAGE_LIMIT,
  MAX_PAGE_LIMIT,
  type AdminUserSummary,
  type NoteView,
  type Page,
} from '@notes/shared';
import type { AccountContext } from '../auth/account-context';
import { RequireRoles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { CurrentUser } from '../common/current-user.decorator';
import { UpdateNoteDto } from '../notes/dto';
import { NotesService } from '../notes/notes.service';
import { RejectNoteDto } from '../publication/dto';
import { PublicationService } from '../publication/publication.service';
import { AdminService } from './admin.service';
import { AdminListQuery } from './dto';

/**
 * Everything here requires the admin role. The class-level decorators mean a
 * new route added to this controller is gated by default.
 */
@Controller('admin')
@UseGuards(RolesGuard)
@RequireRoles(Role.ADMIN)
export class AdminController {
  constructor(
    private readonly admin: AdminService,
    private readonly notes: NotesService,
    private readonly publication: PublicationService,
  ) {}

  private static paging(query: AdminListQuery) {
    return {
      page: query.page ?? 1,
      limit: Math.min(query.limit ?? DEFAULT_PAGE_LIMIT, MAX_PAGE_LIMIT),
    };
  }

  @Get('notes')
  listNotes(@Query() query: AdminListQuery): Promise<Page<NoteView>> {
    return this.admin.listNotes({ ...AdminController.paging(query), tag: query.tag });
  }

  @Get('notes/:id')
  readNote(@Param('id', ParseIntPipe) id: number): Promise<NoteView> {
    return this.admin.readNote(id);
  }

  @Patch('notes/:id')
  updateNote(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateNoteDto,
  ): Promise<NoteView> {
    // Same rules as the owner's update: tags replace the set, and editing a
    // published note returns it to moderation (platform-administration).
    return this.notes.updateAny(id, dto);
  }

  @Delete('notes/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteNote(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.admin.deleteNote(id);
  }

  @Get('moderation')
  queue(@Query() query: AdminListQuery): Promise<Page<NoteView>> {
    return this.publication.queue(AdminController.paging(query));
  }

  @Post('notes/:id/approve')
  @HttpCode(HttpStatus.OK)
  approve(@Param('id', ParseIntPipe) id: number): Promise<NoteView> {
    return this.publication.approve(id);
  }

  @Post('notes/:id/reject')
  @HttpCode(HttpStatus.OK)
  reject(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RejectNoteDto,
  ): Promise<NoteView> {
    return this.publication.reject(id, dto.reason);
  }

  @Get('users')
  listUsers(@Query() query: AdminListQuery): Promise<Page<AdminUserSummary>> {
    return this.admin.listUsers(AdminController.paging(query));
  }

  @Post('users/:id/ban')
  @HttpCode(HttpStatus.NO_CONTENT)
  ban(
    @CurrentUser() account: AccountContext,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<void> {
    return this.admin.ban(id, account.id);
  }

  @Delete('users/:id/ban')
  @HttpCode(HttpStatus.NO_CONTENT)
  unban(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.admin.unban(id);
  }

  @Delete('users/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteUser(
    @CurrentUser() account: AccountContext,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<void> {
    return this.admin.deleteUser(id, account.id);
  }
}
