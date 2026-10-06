import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';

import { JwtAccessGuard } from '../../auth/guards/jwt-access.guard.js';
import { PermissionGuard } from '../../permissions/permission.guard.js';
import { RequirePermissions } from '../../permissions/permission.decorator.js';
import { PERMISSIONS } from '../../permissions/permission.constants.js';

import { CandidatesService } from './candidates.service.js';
import { CreateCandidateDto } from './dto/create-candidate.dto.js';
import { UpdateCandidateDto } from './dto/update-candidate.dto.js';
import { CandidateQueryDto } from './dto/candidate-query.dto.js';

@Controller({
  path: 'candidates',
  version: '1',
})
@UseGuards(JwtAccessGuard, PermissionGuard)
export class CandidatesController {
  constructor(
    private readonly candidatesService: CandidatesService,
  ) {}

  @Post()
  @RequirePermissions(PERMISSIONS.RECRUITMENT_MANAGE)
  create(
    @Body() dto: CreateCandidateDto,
    @Request() req: any,
  ) {
    return this.candidatesService.create(dto, req.user);
  }

  @Get()
  @RequirePermissions(PERMISSIONS.RECRUITMENT_READ)
  findAll(
    @Query() query: CandidateQueryDto,
    @Request() req: any,
  ) {
    return this.candidatesService.findAll(query, req.user);
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.RECRUITMENT_READ)
  findOne(
    @Param('id') id: string,
    @Request() req: any,
  ) {
    return this.candidatesService.findOne(id, req.user);
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.RECRUITMENT_MANAGE)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateCandidateDto,
    @Request() req: any,
  ) {
    return this.candidatesService.update(id, dto, req.user);
  }
}