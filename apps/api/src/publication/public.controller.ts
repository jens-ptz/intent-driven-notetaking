import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import type { Page, PublicNoteView } from '@notes/shared';
import { MAX_PAGE_LIMIT, DEFAULT_PAGE_LIMIT } from '@notes/shared';
import { Public } from '../auth/public.decorator';
import { FeedQuery } from './dto';
import { PublicationService } from './publication.service';

/** The only anonymous read path in the platform. */
@Controller('public/notes')
export class PublicNotesController {
  constructor(private readonly publication: PublicationService) {}

  @Public()
  @Get()
  feed(@Query() query: FeedQuery): Promise<Page<PublicNoteView>> {
    return this.publication.feed({
      page: query.page ?? 1,
      limit: Math.min(query.limit ?? DEFAULT_PAGE_LIMIT, MAX_PAGE_LIMIT),
      tag: query.tag,
    });
  }

  @Public()
  @Get(':id')
  read(@Param('id', ParseIntPipe) id: number): Promise<PublicNoteView> {
    return this.publication.readPublic(id);
  }
}
