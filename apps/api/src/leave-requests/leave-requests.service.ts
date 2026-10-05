import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import {
  LeaveRequest,
  LeaveRequestDocument,
  LeaveRequestStatus,
} from './schemas/leave-request.schema.js';

import {
  LeaveType,
  LeaveTypeDocument,
} from '../leave-types/schemas/leave-type.schema.js';

import {
  Employee,
  EmployeeDocument,
} from '../employees/schemas/employee.schema.js';

import { CreateLeaveRequestDto } from './dto/create-leave-request.dto.js';
import { LeaveRequestQueryDto } from './dto/leave-request-query.dto.js';
import { RejectLeaveRequestDto } from './dto/reject-leave-request.dto.js';

import type { AuthenticatedUser } from '../auth/strategies/jwt-access.strategy.js';

import { RolesService } from '../roles/roles.service.js';

import { AuditLogsService } from '../audit-logs/audit-logs.service.js';
import {
  AuditAction,
  AuditEntity,
} from '../audit-logs/schemas/audit-log.schema.js';

import { PERMISSIONS } from '../permissions/permission.constants.js';

@Injectable()
export class LeaveRequestsService {
  constructor(
    @InjectModel(LeaveRequest.name)
    private readonly leaveRequestModel: Model<LeaveRequestDocument>,

    @InjectModel(LeaveType.name)
    private readonly leaveTypeModel: Model<LeaveTypeDocument>,

    @InjectModel(Employee.name)
    private readonly employeeModel: Model<EmployeeDocument>,

    private readonly rolesService: RolesService,

    private readonly auditLogsService: AuditLogsService,
  ) {}

  async create(
    employeeId: string,
    leaveTypeId: string,
    dto: CreateLeaveRequestDto,
    user: AuthenticatedUser,
  ) {
    const organizationId =
      this.toObjectId(user.organizationId);

    const employeeObjectId =
      this.toObjectId(employeeId);

    const leaveTypeObjectId =
      this.toObjectId(leaveTypeId);

    const employee =
      await this.employeeModel
        .findOne({
          _id: employeeObjectId,
          organizationId,
        })
        .lean()
        .exec();

    if (!employee) {
      throw new NotFoundException(
        'Employee not found',
      );
    }

    await this.assertCanCreateForEmployee(
      employee,
      user,
    );

    const leaveType =
      await this.leaveTypeModel
        .findOne({
          _id: leaveTypeObjectId,
          organizationId,
          isActive: true,
        })
        .lean()
        .exec();

    if (!leaveType) {
      throw new NotFoundException(
        'Active leave type not found',
      );
    }

    const startDate =
      this.normalizeDate(dto.startDate);

    const endDate =
      this.normalizeDate(dto.endDate);

    if (endDate < startDate) {
      throw new BadRequestException(
        'End date cannot be earlier than start date',
      );
    }

    const totalDays =
      this.calculateCalendarDays(
        startDate,
        endDate,
      );

    const overlappingRequest =
      await this.leaveRequestModel.exists({
        organizationId,
        employeeId: employeeObjectId,
        status: {
          $in: [
            LeaveRequestStatus.PENDING,
            LeaveRequestStatus.APPROVED,
          ],
        },
        startDate: {
          $lte: endDate,
        },
        endDate: {
          $gte: startDate,
        },
      });

    if (overlappingRequest) {
      throw new ConflictException(
        'Employee already has a pending or approved leave request overlapping these dates',
      );
    }

    const createdRequest =
      await this.leaveRequestModel.create({
        organizationId,
        employeeId: employeeObjectId,
        leaveTypeId: leaveTypeObjectId,
        startDate,
        endDate,
        totalDays,
        status:
          LeaveRequestStatus.PENDING,
        reason: dto.reason?.trim(),
      });

    await this.auditLogsService.record({
      user,
      action: AuditAction.CREATE,
      entity: AuditEntity.LEAVE_REQUEST,
      entityId: createdRequest._id,
      metadata: {
        leaveTypeId:
          leaveTypeObjectId.toString(),
        startDate:
          startDate.toISOString(),
        endDate:
          endDate.toISOString(),
        totalDays,
        status:
          LeaveRequestStatus.PENDING,
      },
    });

    return createdRequest;
  }

  async findAll(
    query: LeaveRequestQueryDto,
    user: AuthenticatedUser,
  ) {
    const organizationId =
      this.toObjectId(user.organizationId);

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const filter: Record<string, unknown> = {
      organizationId,
    };

    if (query.status !== undefined) {
      filter.status = query.status;
    }

    if (query.employeeId !== undefined) {
      filter.employeeId =
        this.toObjectId(query.employeeId);
    }

    const [items, total] =
      await Promise.all([
        this.leaveRequestModel
          .find(filter)
          .sort({
            startDate: -1,
            createdAt: -1,
          })
          .skip((page - 1) * limit)
          .limit(limit)
          .lean()
          .exec(),

        this.leaveRequestModel.countDocuments(
          filter,
        ),
      ]);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(
          total / limit,
        ),
      },
    };
  }

  async findMine(
    query: LeaveRequestQueryDto,
    user: AuthenticatedUser,
  ) {
    const organizationId =
      this.toObjectId(user.organizationId);

    const employee =
      await this.employeeModel
        .findOne({
          organizationId,
          userId: this.toObjectId(
            user.userId,
          ),
        })
        .select('_id')
        .lean()
        .exec();

    if (!employee) {
      throw new NotFoundException(
        'Employee profile not found for the authenticated user',
      );
    }

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const filter: Record<string, unknown> =
      {
        organizationId,
        employeeId: employee._id,
      };

    if (query.status !== undefined) {
      filter.status = query.status;
    }

    const [items, total] =
      await Promise.all([
        this.leaveRequestModel
          .find(filter)
          .sort({
            startDate: -1,
            createdAt: -1,
          })
          .skip((page - 1) * limit)
          .limit(limit)
          .lean()
          .exec(),

        this.leaveRequestModel.countDocuments(
          filter,
        ),
      ]);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(
          total / limit,
        ),
      },
    };
  }

  async findTeam(
    query: LeaveRequestQueryDto,
    user: AuthenticatedUser,
  ) {
    const organizationId =
      this.toObjectId(user.organizationId);

    const manager =
      await this.employeeModel
        .findOne({
          organizationId,
          userId: this.toObjectId(
            user.userId,
          ),
        })
        .select('_id')
        .lean()
        .exec();

    if (!manager) {
      throw new NotFoundException(
        'Employee profile not found for the authenticated user',
      );
    }

    const teamEmployees =
      await this.employeeModel
        .find({
          organizationId,
          managerId: manager._id,
        })
        .select('_id')
        .lean()
        .exec();

    const employeeIds =
      teamEmployees.map(
        (employee) => employee._id,
      );

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const filter: Record<string, unknown> =
      {
        organizationId,
        employeeId: {
          $in: employeeIds,
        },
      };

    if (query.status !== undefined) {
      filter.status = query.status;
    }

    const [items, total] =
      await Promise.all([
        this.leaveRequestModel
          .find(filter)
          .sort({
            startDate: -1,
            createdAt: -1,
          })
          .skip((page - 1) * limit)
          .limit(limit)
          .lean()
          .exec(),

        this.leaveRequestModel.countDocuments(
          filter,
        ),
      ]);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(
          total / limit,
        ),
      },
    };
  }

  async findOne(
    id: string,
    user: AuthenticatedUser,
  ) {
    const organizationId =
      this.toObjectId(user.organizationId);

    const requestId =
      this.toObjectId(id);

    const request =
      await this.leaveRequestModel
        .findOne({
          _id: requestId,
          organizationId,
        })
        .lean()
        .exec();

    if (!request) {
      throw new NotFoundException(
        'Leave request not found',
      );
    }

    return request;
  }

  async approve(
    id: string,
    user: AuthenticatedUser,
  ) {
    const organizationId =
      this.toObjectId(user.organizationId);

    const requestId =
      this.toObjectId(id);

    const request =
      await this.leaveRequestModel
        .findOne({
          _id: requestId,
          organizationId,
        })
        .exec();

    if (!request) {
      throw new NotFoundException(
        'Leave request not found',
      );
    }

    await this.assertCanApproveRequest(
      request.employeeId,
      user,
    );

    if (
      request.status !==
      LeaveRequestStatus.PENDING
    ) {
      throw new BadRequestException(
        `Cannot approve a ${request.status.toLowerCase()} leave request`,
      );
    }

    request.status =
      LeaveRequestStatus.APPROVED;

    request.approvedBy =
      this.toObjectId(user.userId);

    request.approvedAt = new Date();

    const approvedRequest =
      await request.save();

    await this.auditLogsService.record({
      user,
      action: AuditAction.APPROVE,
      entity: AuditEntity.LEAVE_REQUEST,
      entityId: approvedRequest._id,
      metadata: {
        previousStatus:
          LeaveRequestStatus.PENDING,
        newStatus:
          LeaveRequestStatus.APPROVED,
        approvedAt:
          approvedRequest.approvedAt?.toISOString(),
      },
    });

    return approvedRequest;
  }

  async reject(
    id: string,
    dto: RejectLeaveRequestDto,
    user: AuthenticatedUser,
  ) {
    const organizationId =
      this.toObjectId(user.organizationId);

    const requestId =
      this.toObjectId(id);

    const request =
      await this.leaveRequestModel
        .findOne({
          _id: requestId,
          organizationId,
        })
        .exec();

    if (!request) {
      throw new NotFoundException(
        'Leave request not found',
      );
    }

    await this.assertCanApproveRequest(
      request.employeeId,
      user,
    );

    if (
      request.status !==
      LeaveRequestStatus.PENDING
    ) {
      throw new BadRequestException(
        `Cannot reject a ${request.status.toLowerCase()} leave request`,
      );
    }

    request.status =
      LeaveRequestStatus.REJECTED;

    request.rejectedBy =
      this.toObjectId(user.userId);

    request.rejectedAt = new Date();

    request.rejectionReason =
      dto.reason.trim();

    const rejectedRequest =
      await request.save();

    await this.auditLogsService.record({
      user,
      action: AuditAction.REJECT,
      entity: AuditEntity.LEAVE_REQUEST,
      entityId: rejectedRequest._id,
      metadata: {
        previousStatus:
          LeaveRequestStatus.PENDING,
        newStatus:
          LeaveRequestStatus.REJECTED,
        rejectionReason:
          rejectedRequest.rejectionReason,
        rejectedAt:
          rejectedRequest.rejectedAt?.toISOString(),
      },
    });

    return rejectedRequest;
  }

  async cancel(
    id: string,
    user: AuthenticatedUser,
  ) {
    const organizationId =
      this.toObjectId(user.organizationId);

    const requestId =
      this.toObjectId(id);

    const request =
      await this.leaveRequestModel
        .findOne({
          _id: requestId,
          organizationId,
        })
        .exec();

    if (!request) {
      throw new NotFoundException(
        'Leave request not found',
      );
    }

    await this.assertCanCancelRequest(
      request.employeeId,
      user,
    );

    if (
      request.status !==
        LeaveRequestStatus.PENDING &&
      request.status !==
        LeaveRequestStatus.APPROVED
    ) {
      throw new BadRequestException(
        `Cannot cancel a ${request.status.toLowerCase()} leave request`,
      );
    }

    const previousStatus =
      request.status;

    request.status =
      LeaveRequestStatus.CANCELLED;

    request.cancelledBy =
      this.toObjectId(user.userId);

    request.cancelledAt = new Date();

    const cancelledRequest =
      await request.save();

    await this.auditLogsService.record({
      user,
      action: AuditAction.CANCEL,
      entity: AuditEntity.LEAVE_REQUEST,
      entityId: cancelledRequest._id,
      metadata: {
        previousStatus,
        newStatus:
          LeaveRequestStatus.CANCELLED,
        cancelledAt:
          cancelledRequest.cancelledAt?.toISOString(),
      },
    });

    return cancelledRequest;
  }

  private async assertCanCreateForEmployee(
    employee: EmployeeDocument,
    user: AuthenticatedUser,
  ): Promise<void> {
    const permissions =
      await this.rolesService.getUserPermissions(
        user.userId,
        user.organizationId,
      );

    if (
      permissions.includes(
        PERMISSIONS.LEAVE_VIEW_ALL,
      )
    ) {
      return;
    }

    if (
      employee.userId?.toString() !==
      user.userId
    ) {
      throw new ForbiddenException(
        'You can only create leave requests for yourself',
      );
    }
  }

  private async assertCanCancelRequest(
    employeeId: Types.ObjectId,
    user: AuthenticatedUser,
  ): Promise<void> {
    const permissions =
      await this.rolesService.getUserPermissions(
        user.userId,
        user.organizationId,
      );

    if (
      permissions.includes(
        PERMISSIONS.LEAVE_VIEW_ALL,
      )
    ) {
      return;
    }

    const employee =
      await this.employeeModel
        .findOne({
          _id: employeeId,
          organizationId:
            this.toObjectId(
              user.organizationId,
            ),
        })
        .select('userId')
        .lean()
        .exec();

    if (!employee) {
      throw new NotFoundException(
        'Employee not found',
      );
    }

    if (
      employee.userId?.toString() !==
      user.userId
    ) {
      throw new ForbiddenException(
        'You can only cancel your own leave requests',
      );
    }
  }

  private async assertCanApproveRequest(
    employeeId: Types.ObjectId,
    user: AuthenticatedUser,
  ): Promise<void> {
    const permissions =
      await this.rolesService.getUserPermissions(
        user.userId,
        user.organizationId,
      );

    if (
      permissions.includes(
        PERMISSIONS.LEAVE_VIEW_ALL,
      )
    ) {
      return;
    }

    const manager =
      await this.employeeModel
        .findOne({
          organizationId:
            this.toObjectId(
              user.organizationId,
            ),
          userId: this.toObjectId(
            user.userId,
          ),
        })
        .select('_id')
        .lean()
        .exec();

    if (!manager) {
      throw new NotFoundException(
        'Manager employee profile not found',
      );
    }

    const employee =
      await this.employeeModel
        .findOne({
          _id: employeeId,
          organizationId:
            this.toObjectId(
              user.organizationId,
            ),
        })
        .select('managerId')
        .lean()
        .exec();

    if (!employee) {
      throw new NotFoundException(
        'Employee not found',
      );
    }

    if (
      employee.managerId?.toString() !==
      manager._id.toString()
    ) {
      throw new ForbiddenException(
        'You can only approve or reject leave requests for your direct reports',
      );
    }
  }

  private normalizeDate(
    value: string,
  ): Date {
    const date = new Date(
      `${value.slice(0, 10)}T00:00:00.000Z`,
    );

    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException(
        'Invalid date',
      );
    }

    return date;
  }

  private calculateCalendarDays(
    startDate: Date,
    endDate: Date,
  ): number {
    const millisecondsPerDay =
      24 * 60 * 60 * 1000;

    return (
      Math.floor(
        (endDate.getTime() -
          startDate.getTime()) /
          millisecondsPerDay,
      ) + 1
    );
  }

  private toObjectId(
    value: string,
  ): Types.ObjectId {
    if (!Types.ObjectId.isValid(value)) {
      throw new BadRequestException(
        'Invalid ObjectId',
      );
    }

    return new Types.ObjectId(value);
  }
}