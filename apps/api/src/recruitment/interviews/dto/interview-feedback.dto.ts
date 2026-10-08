import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

import { InterviewRecommendation } from '../schemas/interview.schema.js';

export class InterviewFeedbackDto {
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  feedback?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number;

  @IsOptional()
  @IsEnum(InterviewRecommendation)
  recommendation?: InterviewRecommendation;

  @IsOptional()
  @IsString()
  @MaxLength(3000)
  notes?: string;
}
