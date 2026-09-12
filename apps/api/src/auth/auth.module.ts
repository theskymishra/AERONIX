import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { PassportModule } from '@nestjs/passport';

import { OrganizationsModule } from '../organizations/organizations.module.js';
import { UsersModule } from '../users/users.module.js';

import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { PasswordService } from './password.service.js';
import { TokenService } from './token.service.js';

import {
  RefreshSession,
  RefreshSessionSchema,
} from './schemas/refresh-session.schema.js';

import { JwtAccessStrategy } from './strategies/jwt-access.strategy.js';

@Module({
  imports: [
    ConfigModule,

    PassportModule.register({
      defaultStrategy: 'jwt-access',
    }),

    OrganizationsModule,
    UsersModule,

    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>(
          'JWT_ACCESS_SECRET',
        ),
        signOptions: {
          expiresIn: configService.getOrThrow<
            `${number}${'ms' | 's' | 'm' | 'h' | 'd' | 'w' | 'y'}`
          >('JWT_ACCESS_EXPIRES_IN'),
        },
      }),
    }),

    MongooseModule.forFeature([
      {
        name: RefreshSession.name,
        schema: RefreshSessionSchema,
      },
    ]),
  ],

  controllers: [AuthController],

  providers: [
    PasswordService,
    TokenService,
    AuthService,
    JwtAccessStrategy,
  ],

  exports: [
    MongooseModule,
    PasswordService,
    TokenService,
    AuthService,
    JwtModule,
    PassportModule,
  ],
})
export class AuthModule {}