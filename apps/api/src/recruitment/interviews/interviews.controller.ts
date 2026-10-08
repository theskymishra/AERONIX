import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';

import { JwtAccessGuard } from '../../auth/guards/jwt-access.guard.js';
import { PermissionGuard } from '../../permissions/permission.guard.js';
import { RequirePermissions } from '../../permissions/permission.decorator.js';
import { PERMISSIONS } from '../../permissions/permission.constants.js';

import { CancelInterviewDto } from './dto/cancel-interview.dto.js';
import { CreateInterviewDto } from './dto/create-interview.dto.js';
import { InterviewFeedbackDto } from './dto/interview-feedback.dto.js';
import { InterviewQueryDto } from './dto/interview-query.dto.js';
import { UpdateInterviewDto } from './dto/update-interview.dto.js';
import { InterviewsService } from './interviews.service.js';

@Controller({
  path: 'interviews',
  version: '1',
})
@UseGuards(JwtAccessGuard, PermissionGuard)
export class InterviewsController {
  constructor(
    private readonly interviewsService: InterviewsService,
  ) {}

  @Post('applications/:applicationId')
  @RequirePermissions(PERMISSIONS.RECRUITMENT_MANAGE)
  create(
    @Req() req: any,
    @Param('applicationId') applicationId: string,
    @Body() dto: CreateInterviewDto,
  ) {
    return this.interviewsService.create(
      req.user,
      applicationId,
      dto,
    );
  }

  @Get()
  @RequirePermissions(PERMISSIONS.RECRUITMENT_READ)
  findAll(
    @Req() req: any,
    @Query() query: InterviewQueryDto,
  ) {
    return this.interviewsService.findAll(req.user, query);
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.RECRUITMENT_READ)
  findOne(
    @Req() req: any,
    @Param('id') id: string,
  ) {
    return this.interviewsService.findOne(req.user, id);
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.RECRUITMENT_MANAGE)
  update(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateInterviewDto,
  ) {
    return this.interviewsService.update(
      req.user,
      id,
      dto,
    );
  }

  @Post(':id/confirm')
  @RequirePermissions(PERMISSIONS.RECRUITMENT_MANAGE)
  confirm(
    @Req() req: any,
    @Param('id') id: string,
  ) {
    return this.interviewsService.confirm(req.user, id);
  }

  @Post(':id/complete')
  @RequirePermissions(PERMISSIONS.RECRUITMENT_MANAGE)
  complete(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: InterviewFeedbackDto,
  ) {
    return this.interviewsService.complete(
      req.user,
      id,
      dto,
    );
  }

  @Post(':id/cancel')
  @RequirePermissions(PERMISSIONS.RECRUITMENT_MANAGE)
  cancel(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: CancelInterviewDto,
  ) {
    return this.interviewsService.cancel(
      req.user,
      id,
      dto,
    );
  }

  @Post(':id/reschedule')
  @RequirePermissions(PERMISSIONS.RECRUITMENT_MANAGE)
  reschedule(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: CreateInterviewDto,
  ) {
    return this.interviewsService.reschedule(
      req.user,
      id,
      dto,
    );
  }

  @Post(':id/no-show')
  @RequirePermissions(PERMISSIONS.RECRUITMENT_MANAGE)
  markNoShow(
    @Req() req: any,
    @Param('id') id: string,
  ) {
    return this.interviewsService.markNoShow(
      req.user,
      id,
    );
  }

  @Post(':id/feedback')
  @RequirePermissions(PERMISSIONS.RECRUITMENT_MANAGE)
  addFeedback(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: InterviewFeedbackDto,
  ) {
    return this.interviewsService.addFeedback(
      req.user,
      id,
      dto,
    );
  }
}
