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
} from '@nestjs/common';
import type { NoteView, Page } from '@notes/shared';
import type { AccountContext } from '../auth/account-context';
import { CurrentUser } from '../common/current-user.decorator';
import { CreateNoteDto, ListNotesQuery, UpdateNoteDto } from './dto';
import { toNoteView } from './note.view';
import { NotesService } from './notes.service';

@Controller('notes')
export class NotesController {
  constructor(private readonly notes: NotesService) {}

  @Post()
  create(@CurrentUser() account: AccountContext, @Body() dto: CreateNoteDto): Promise<NoteView> {
    return this.notes.create(account.id, dto);
  }

  @Get()
  list(
    @CurrentUser() account: AccountContext,
    @Query() query: ListNotesQuery,
  ): Promise<Page<NoteView>> {
    return this.notes.listOwn(account.id, {
      page: query.page ?? 1,
      limit: ListNotesQuery.clampLimit(query.limit),
      tag: query.tag,
    });
  }

  @Get(':id')
  async read(
    @CurrentUser() account: AccountContext,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<NoteView> {
    return toNoteView(await this.notes.requireOwned(id, account.id));
  }

  @Patch(':id')
  update(
    @CurrentUser() account: AccountContext,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateNoteDto,
  ): Promise<NoteView> {
    return this.notes.update(id, account.id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @CurrentUser() account: AccountContext,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<void> {
    return this.notes.deleteOwn(id, account.id);
  }
}
