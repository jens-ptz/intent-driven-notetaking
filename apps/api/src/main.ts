import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { loadConfig } from './config/env';

async function bootstrap(): Promise<void> {
  const config = loadConfig();
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api/v1');
  app.use(cookieParser());

  // Credentials must be allowed for the session cookie to travel at all, and
  // the origin is pinned rather than reflected (ADR-0002).
  app.enableCors({ origin: config.webOrigin, credentials: true });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      // Unknown properties are rejected outright, so a registration request
      // cannot smuggle a `roles` field past the DTO (user-accounts).
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.listen(config.port);
}

void bootstrap();
