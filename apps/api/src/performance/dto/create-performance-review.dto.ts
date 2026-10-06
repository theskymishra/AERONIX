import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreatePerformanceReviewDto {
  @IsString()
  @MaxLength(150)
  reviewPeriod!: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number;

  @IsOptional()
  @IsString()
  @MaxLength(3000)
  strengths?: string;

  @IsOptional()
  @IsString()
  @MaxLength(3000)
  areasForImprovement?: string;

  @IsOptional()
  @IsString()
  @MaxLength(3000)
  comments?: string;
}
