import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { AdminModule } from './admin/admin.module';
import { AuthGuard } from './auth/auth.guard';
import { AuthModule } from './auth/auth.module';
import { OriginGuard } from './common/origin.guard';
import { HealthModule } from './health/health.module';
import { NotesModule } from './notes/notes.module';
import { PublicationModule } from './publication/publication.module';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    // The repository's .env sits at the root, two levels up from this app.
    // Root scripts hand it down via dotenv-cli; this fallback covers running
    // nest directly from apps/api.
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ['.env', '../../.env'] }),
    PrismaModule,
    AuthModule,
    UsersModule,
    NotesModule,
    PublicationModule,
    AdminModule,
    HealthModule,
  ],
  providers: [
    // Authenticated by default: a new route is protected unless it opts out
    // with @Public(), so forgetting the decorator fails closed.
    { provide: APP_GUARD, useClass: OriginGuard },
    { provide: APP_GUARD, useClass: AuthGuard },
  ],
})
export class AppModule {}
