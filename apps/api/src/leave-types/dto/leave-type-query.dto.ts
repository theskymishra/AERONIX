import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsOptional,
  IsString,
  Max,
  Min,
  IsInt,
} from 'class-validator';

export class LeaveTypeQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
