
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

import type { Permission } from '../../permissions/permission.constants.js';

export type RoleDocument = HydratedDocument<Role>;

@Schema({
  timestamps: true,
  collection: 'roles',
})
export class Role {
  @Prop({
    type: Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true,
  })
  organizationId!: Types.ObjectId;

  @Prop({
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 80,
  })
  name!: string;

  @Prop({
    required: true,
    lowercase: true,
    trim: true,
    maxlength: 80,
    match: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
  })
  slug!: string;

  @Prop({
    trim: true,
    maxlength: 300,
  })
  description?: string;

  @Prop({
    required: true,
    enum: [
      'SUPER_ADMIN',
      'HR_MANAGER',
      'DEPARTMENT_MANAGER',
      'EMPLOYEE',
    ],
  })
  key!:
    | 'SUPER_ADMIN'
    | 'HR_MANAGER'
    | 'DEPARTMENT_MANAGER'
    | 'EMPLOYEE';

  @Prop({
    type: [String],
    default: [],
  })
  permissions!: Permission[];

  @Prop({
    required: true,
    default: true,
  })
  isSystemRole!: boolean;

  @Prop({
    required: true,
    default: true,
  })
  isActive!: boolean;
}

export const RoleSchema = SchemaFactory.createForClass(Role);

RoleSchema.index(
  { organizationId: 1, slug: 1 },
  { unique: true },
);

RoleSchema.index(
  { organizationId: 1, key: 1 },
  { unique: true },
);

