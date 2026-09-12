import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import {
  Organization,
  OrganizationSchema,
} from '../organizations/schemas/organization.schema.js';

import {
  User,
  UserSchema,
} from '../users/schemas/user.schema.js';

import {
  Role,
  RoleSchema,
} from './schemas/role.schema.js';

import { RolesSeederService } from './roles-seeder.service.js';
import { RolesService } from './roles.service.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Role.name,
        schema: RoleSchema,
      },
      {
        name: Organization.name,
        schema: OrganizationSchema,
      },
      {
        name: User.name,
        schema: UserSchema,
      },
    ]),
  ],

  providers: [
    RolesSeederService,
    RolesService,
  ],

  exports: [
    MongooseModule,
    RolesSeederService,
    RolesService,
  ],
})
export class RolesModule {}