import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

@Schema({
  timestamps: true,
  collection: 'users',
})
export class User {
  @Prop({
    type: Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true,
  })
  organizationId!: Types.ObjectId;

  @Prop({
    required: true,
    lowercase: true,
    trim: true,
    maxlength: 254,
  })
  email!: string;

  @Prop({
    required: true,
    select: false,
  })
  passwordHash!: string;

  @Prop({
    required: true,
    trim: true,
    minlength: 1,
    maxlength: 80,
  })
  firstName!: string;

  @Prop({
    required: true,
    trim: true,
    minlength: 1,
    maxlength: 80,
  })
  lastName!: string;

  @Prop({
    required: true,
    enum: ['ACTIVE', 'INVITED', 'SUSPENDED', 'DISABLED'],
    default: 'INVITED',
  })
  status!: 'ACTIVE' | 'INVITED' | 'SUSPENDED' | 'DISABLED';

  @Prop({
    required: true,
    default: false,
  })
  emailVerified!: boolean;

  @Prop({
    type: Types.ObjectId,
    ref: 'Role',
    required: false,
  })
  roleId?: Types.ObjectId;

  @Prop()
  lastLoginAt?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.index(
  { organizationId: 1, email: 1 },
  { unique: true },
);