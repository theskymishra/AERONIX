import {
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

import { InterviewType } from '../schemas/interview.schema.js';

export class CreateInterviewDto {
  @IsEnum(InterviewType)
  type!: InterviewType;

  @IsDateString()
  scheduledAt!: string;

  @IsInt()
  @Min(15)
  @Max(480)
  durationMinutes!: number;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  location?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  meetingLink?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  interviewerIds?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(3000)
  notes?: string;
}
