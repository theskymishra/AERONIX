import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type AnnouncementDocument = HydratedDocument<Announcement>;

export enum AnnouncementStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
}

export enum AnnouncementPriority {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export enum AnnouncementTargetAudience {
  ALL = 'ALL',
  DEPARTMENT = 'DEPARTMENT',
  ROLE = 'ROLE',
}

@Schema({
  timestamps: true,
  collection: 'announcements',
})
export class Announcement {
  @Prop({
    type: Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true,
  })
  organizationId!: Types.ObjectId;

  @Prop({ required: true, trim: true, maxlength: 200 })
  title!: string;

  @Prop({ required: true, trim: true, maxlength: 10000 })
  content!: string;

  @Prop({
    type: String,
    enum: Object.values(AnnouncementStatus),
    required: true,
    default: AnnouncementStatus.DRAFT,
  })
  status!: AnnouncementStatus;

  @Prop({
    type: String,
    enum: Object.values(AnnouncementPriority),
    required: true,
    default: AnnouncementPriority.NORMAL,
  })
  priority!: AnnouncementPriority;

  @Prop({
    type: String,
    enum: Object.values(AnnouncementTargetAudience),
    required: true,
    default: AnnouncementTargetAudience.ALL,
  })
  targetAudience!: AnnouncementTargetAudience;

  @Prop({
    type: [{ type: Types.ObjectId, ref: 'Department' }],
    default: [],
  })
  targetDepartmentIds!: Types.ObjectId[];

  @Prop({
    type: [String],
    default: [],
  })
  targetRoles!: string[];

  @Prop()
  publishedAt?: Date;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  publishedBy?: Types.ObjectId;

  @Prop()
  archivedAt?: Date;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  archivedBy?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  updatedBy?: Types.ObjectId;
}

export const AnnouncementSchema = SchemaFactory.createForClass(Announcement);

AnnouncementSchema.index({
  organizationId: 1,
  status: 1,
  publishedAt: -1,
});

AnnouncementSchema.index({
  organizationId: 1,
  createdAt: -1,
});
