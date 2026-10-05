import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  Matches,
} from 'class-validator';

export class CreateLeaveTypeDto {
  @IsString()
  @MaxLength(100)
  name!: string;

  @IsString()
  @MaxLength(30)
  @Matches(/^[A-Z0-9_]+$/, {
    message: 'code must contain uppercase letters, numbers, and underscores only',
  })
  code!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsInt()
  @Min(0)
  @Max(365)
  annualAllocation!: number;

  @IsOptional()
  @IsBoolean()
  carryForwardAllowed?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(365)
  maxCarryForwardDays?: number;

  @IsOptional()
  @IsBoolean()
  requiresApproval?: boolean;

  @IsOptional()
  @IsBoolean()
  isPaid?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
