import { Module } from '@nestjs/common';
import { NotesModule } from '../notes/notes.module';
import { PublicationModule } from '../publication/publication.module';
import { UsersModule } from '../users/users.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  imports: [NotesModule, PublicationModule, UsersModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
