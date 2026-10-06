import { PartialType } from '@nestjs/mapped-types';

import { CreatePerformanceReviewDto } from './create-performance-review.dto.js';

export class UpdatePerformanceReviewDto extends PartialType(
  CreatePerformanceReviewDto,
) {}
