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

  // Unknown properties are stripped, not rejected. Registration is public and
  // has many clients, so an extra field is noise. What stops a new account
  // granting itself ADMIN is that RegisterDto has no `roles` field and the
  // service hard-codes the role.
  //
  // Routes where an unknown property means a deliberate escalation attempt -
  // updating your own profile - opt into StrictBody and refuse it loudly.
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  await app.listen(config.port);
}

void bootstrap();
