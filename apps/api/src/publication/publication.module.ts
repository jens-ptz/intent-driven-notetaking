import { Module } from '@nestjs/common';
import { NotesModule } from '../notes/notes.module';
import { NotePublicationController } from './publication.controller';
import { PublicationService } from './publication.service';
import { PublicNotesController } from './public.controller';

@Module({
  imports: [NotesModule],
  controllers: [NotePublicationController, PublicNotesController],
  providers: [PublicationService],
  exports: [PublicationService],
})
export class PublicationModule {}
