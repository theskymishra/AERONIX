
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { Organization } from '../organizations/schemas/organization.schema.js';
import { SYSTEM_ROLES } from './role-seed.constants.js';
import { Role } from './schemas/role.schema.js';

@Injectable()
export class RolesSeederService {
  constructor(
    @InjectModel(Role.name)
    private readonly roleModel: Model<Role>,

    @InjectModel(Organization.name)
    private readonly organizationModel: Model<Organization>,
  ) {}

  async seedAllOrganizations(): Promise<number> {
    const organizationIds =
      await this.organizationModel.distinct('_id');

    for (const organizationId of organizationIds) {
      await this.seedForOrganization(
        organizationId as Types.ObjectId,
      );
    }

    return organizationIds.length;
  }

  async seedForOrganization(
    organizationId: Types.ObjectId,
  ): Promise<void> {
    await this.roleModel.bulkWrite(
      SYSTEM_ROLES.map((role) => ({
        updateOne: {
          filter: {
            organizationId,
            key: role.key,
          },
          update: {
            $set: {
              name: role.name,
              slug: role.slug,
              description: role.description,
              permissions: [...role.permissions],
              isSystemRole: true,
              isActive: true,
            },
            $setOnInsert: {
              organizationId,
            },
          },
          upsert: true,
        },
      })),
    );
  }
}

