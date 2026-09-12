import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type OrganizationDocument = HydratedDocument<Organization>;

@Schema({
  timestamps: true,
  collection: 'organizations',
})
export class Organization {
  @Prop({
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 120,
  })
  name!: string;

  @Prop({
    required: true,
    lowercase: true,
    trim: true,
    maxlength: 80,
  })
  slug!: string;

  @Prop({
    required: true,
    enum: ['ACTIVE', 'SUSPENDED', 'ARCHIVED'],
    default: 'ACTIVE',
  })
  status!: 'ACTIVE' | 'SUSPENDED' | 'ARCHIVED';
}

export const OrganizationSchema =
  SchemaFactory.createForClass(Organization);

OrganizationSchema.index({ slug: 1 }, { unique: true });