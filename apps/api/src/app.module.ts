import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

import { HealthController } from './health/health.controller.js';
import { OrganizationsModule } from './organizations/organizations.module.js';
import { UsersModule } from './users/users.module.js';
import { AuthModule } from './auth/auth.module.js';
import { RolesModule } from './roles/roles.module.js';
import { validateEnvironment } from './config/env.validation.js';
import { EmployeesModule } from './employees/employees.module.js';
import { CareerEventsModule } from './career-events/career-events.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validate: validateEnvironment,
    }),

    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.getOrThrow<string>('MONGODB_URI'),
      }),
    }),

    OrganizationsModule,
    UsersModule,
    AuthModule,
    RolesModule,
    EmployeesModule,
    CareerEventsModule,
  ],

  controllers: [HealthController],
})
export class AppModule {}