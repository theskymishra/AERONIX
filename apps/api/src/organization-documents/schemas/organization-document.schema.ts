import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type OrganizationDocumentDoc = HydratedDocument<OrganizationDocument>;

export enum OrganizationDocumentCategory {
  POLICY = 'POLICY',
  HANDBOOK = 'HANDBOOK',
  TEMPLATE = 'TEMPLATE',
  COMPLIANCE = 'COMPLIANCE',
  LEGAL = 'LEGAL',
  BENEFITS = 'BENEFITS',
  OTHER = 'OTHER',
}

export enum OrganizationDocumentStatus {
  ACTIVE = 'ACTIVE',
  ARCHIVED = 'ARCHIVED',
}

@Schema({
  timestamps: true,
  collection: 'organization_documents',
})
export class OrganizationDocument {
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
    maxlength: 200,
  })
  title!: string;

  @Prop({
    type: String,
    required: true,
    enum: Object.values(OrganizationDocumentCategory),
    index: true,
  })
  category!: OrganizationDocumentCategory;

  @Prop({
    trim: true,
    maxlength: 1000,
  })
  description?: string;

  @Prop({
    required: true,
    trim: true,
    maxlength: 255,
  })
  originalFileName!: string;

  @Prop({
    required: true,
    trim: true,
    maxlength: 120,
  })
  mimeType!: string;

  @Prop({
    required: true,
    min: 0,
  })
  fileSize!: number;

  @Prop({
    required: true,
    trim: true,
    maxlength: 500,
  })
  storageKey!: string;

  @Prop({
    type: String,
    required: true,
    enum: Object.values(OrganizationDocumentStatus),
    default: OrganizationDocumentStatus.ACTIVE,
    index: true,
  })
  status!: OrganizationDocumentStatus;

  @Prop({
    trim: true,
    maxlength: 50,
    default: '1.0',
  })
  version?: string;

  @Prop({
    type: [String],
    default: [],
  })
  tags!: string[];

  @Prop()
  archivedAt?: Date;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  archivedBy?: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
  })
  uploadedBy!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  updatedBy?: Types.ObjectId;
}

export const OrganizationDocumentSchema =
  SchemaFactory.createForClass(OrganizationDocument);

OrganizationDocumentSchema.index({
  organizationId: 1,
  status: 1,
  createdAt: -1,
});

OrganizationDocumentSchema.index({
  organizationId: 1,
  category: 1,
  status: 1,
});
