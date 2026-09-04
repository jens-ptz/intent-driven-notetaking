import { Module } from '@nestjs/common';
import { TagsService } from '../tags/tags.service';
import { NotesController } from './notes.controller';
import { NotesRepository } from './notes.repository';
import { NotesService } from './notes.service';

@Module({
  controllers: [NotesController],
  providers: [NotesService, NotesRepository, TagsService],
  exports: [NotesService, NotesRepository, TagsService],
})
export class NotesModule {}
