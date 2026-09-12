
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { User } from '../users/schemas/user.schema.js';
import { Role } from './schemas/role.schema.js';

@Injectable()
export class RolesService {
  constructor(
    @InjectModel(Role.name)
    private readonly roleModel: Model<Role>,

    @InjectModel(User.name)
    private readonly userModel: Model<User>,
  ) {}

  async assignRoleToUser(
    userId: Types.ObjectId,
    roleId: Types.ObjectId,
  ): Promise<void> {
    const user = await this.userModel.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const role = await this.roleModel.findOne({
      _id: roleId,
      organizationId: user.organizationId,
      isActive: true,
    });

    if (!role) {
      throw new BadRequestException(
        'Role is invalid, inactive, or belongs to another organization',
      );
    }

    user.roleId = role._id;
    await user.save();
  }

  async assignRoleByKey(
    userId: Types.ObjectId,
    roleKey: Role['key'],
  ): Promise<void> {
    const user = await this.userModel.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const role = await this.roleModel.findOne({
      organizationId: user.organizationId,
      key: roleKey,
      isActive: true,
    });

    if (!role) {
      throw new BadRequestException(
        'Role is invalid, inactive, or has not been seeded',
      );
    }

    user.roleId = role._id;
    await user.save();
  }

  async assignRoleByEmail(
    email: string,
    roleKey: Role['key'],
  ): Promise<void> {
    const normalizedEmail =
      email.trim().toLowerCase();

    const user = await this.userModel.findOne({
      email: normalizedEmail,
    });

    if (!user) {
      throw new NotFoundException(
        'User not found',
      );
    }

    const role = await this.roleModel.findOne({
      organizationId: user.organizationId,
      key: roleKey,
      isActive: true,
    });

    if (!role) {
      throw new BadRequestException(
        'Role is invalid, inactive, or has not been seeded',
      );
    }

    user.roleId = role._id;
    await user.save();
  }
    async getUserPermissions(
    userId: string,
    organizationId: string,
  ): Promise<string[]> {
    const user = await this.userModel
      .findOne({
        _id: new Types.ObjectId(userId),
        organizationId:
          new Types.ObjectId(organizationId),
      })
      .select('roleId')
      .lean()
      .exec();

    if (!user) {
      throw new NotFoundException(
        'User not found',
      );
    }

    if (!user.roleId) {
      return [];
    }

    const role = await this.roleModel
      .findOne({
        _id: user.roleId,
        organizationId:
          new Types.ObjectId(organizationId),
        isActive: true,
      })
      .select('permissions')
      .lean()
      .exec();

    if (!role) {
      return [];
    }

    return [...role.permissions];
  }
}

