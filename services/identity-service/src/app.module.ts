import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { loadEnvironment } from './config/environment.js';
import { DatabaseModule } from './database/database.module.js';
import { AccessTokenGuard } from './auth/access-token.guard.js';
import { AuthController } from './auth/auth.controller.js';
import { AuthRepository } from './auth/auth.repository.js';
import { AuthService } from './auth/auth.service.js';
import { RolesGuard } from './auth/roles.guard.js';
import { UsersController } from './users/users.controller.js';
import { ConsentsController } from './consents/consents.controller.js';

const environment = loadEnvironment();

@Module({
  imports: [
    DatabaseModule,
    JwtModule.register({
      secret: environment.JWT_ACCESS_SECRET,
      signOptions: { expiresIn: environment.JWT_ACCESS_TTL_SECONDS },
    }),
  ],
  controllers: [AuthController, UsersController, ConsentsController],
  providers: [
    AuthRepository,
    AuthService,
    { provide: APP_GUARD, useClass: AccessTokenGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
