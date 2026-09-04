import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { APP_CONFIG, loadConfig } from '../config/env';
import { UsersRepository } from '../users/users.repository';
import { AuthController } from './auth.controller';
import { AuthGuard } from './auth.guard';
import { AuthService } from './auth.service';

@Global()
@Module({
  imports: [
    JwtModule.registerAsync({
      useFactory: () => {
        const config = loadConfig();
        return {
          secret: config.jwtSecret,
          signOptions: { expiresIn: config.jwtExpiresIn },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    AuthGuard,
    UsersRepository,
    { provide: APP_CONFIG, useFactory: loadConfig },
  ],
  exports: [AuthService, AuthGuard, UsersRepository, APP_CONFIG, JwtModule],
})
export class AuthModule {}
