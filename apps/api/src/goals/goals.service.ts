import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import type { AuthenticatedUser } from '../auth/strategies/jwt-access.strategy.js';
import { AuditAction, AuditEntity } from '../audit-logs/schemas/audit-log.schema.js';
import { AuditLogsService } from '../audit-logs/audit-logs.service.js';
import {
  Employee,
  EmployeeDocument,
} from '../employees/schemas/employee.schema.js';

import { CreateGoalDto } from './dto/create-goal.dto.js';
import { GoalQueryDto } from './dto/goal-query.dto.js';
import { UpdateGoalDto } from './dto/update-goal.dto.js';
import {
  Goal,
  GoalDocument,
  GoalStatus,
} from './schemas/goal.schema.js';

@Injectable()
export class GoalsService {
  constructor(
    @InjectModel(Goal.name)
    private readonly goalModel: Model<Goal>,
    @InjectModel(Employee.name)
    private readonly employeeModel: Model<Employee>,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  async create(
    employeeId: string,
    dto: CreateGoalDto,
    user: AuthenticatedUser,
  ) {
    const organizationId = this.validateObjectId(
      user.organizationId,
      'organizationId',
    );

    const targetEmployeeId = this.validateObjectId(
      employeeId,
      'employeeId',
    );

    if (new Date(dto.dueDate) < new Date(dto.startDate)) {
      throw new BadRequestException(
        'dueDate cannot be before startDate',
      );
    }

    await this.getEmployee(
      targetEmployeeId,
      organizationId,
    );

    const goal = await this.goalModel.create({
      organizationId,
      employeeId: targetEmployeeId,
      createdBy: this.validateObjectId(
        user.userId,
        'userId',
      ),
      title: dto.title,
      description: dto.description,
      category: dto.category,
      priority: dto.priority,
      status: GoalStatus.DRAFT,
      progress: dto.progress ?? 0,
      startDate: new Date(dto.startDate),
      dueDate: new Date(dto.dueDate),
      notes: dto.notes,
    });

    await this.auditLogsService.record({
      user,
      action: AuditAction.CREATE,
      entity: AuditEntity.GOAL,
      entityId: goal._id,
      metadata: {
        employeeId: targetEmployeeId.toString(),
        title: goal.title,
        status: goal.status,
      },
    });

    return goal;
  }

  async findAll(
    query: GoalQueryDto,
    user: AuthenticatedUser,
  ) {
    const organizationId = this.validateObjectId(
      user.organizationId,
      'organizationId',
    );

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const filter: Record<string, unknown> = {
      organizationId,
    };

    if (query.employeeId !== undefined) {
      filter.employeeId = this.validateObjectId(
        query.employeeId,
        'employeeId',
      );
    }

    if (query.status !== undefined) {
      filter.status = query.status;
    }

    if (query.priority !== undefined) {
      filter.priority = query.priority;
    }

    if (query.category !== undefined) {
      filter.category = query.category;
    }

    const [items, total] = await Promise.all([
      this.goalModel
        .find(filter)
        .sort({ dueDate: 1, createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean()
        .exec(),
      this.goalModel.countDocuments(filter).exec(),
    ]);

    return {
      items,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findMine(
    query: GoalQueryDto,
    user: AuthenticatedUser,
  ) {
    const organizationId = this.validateObjectId(
      user.organizationId,
      'organizationId',
    );

    const employee = await this.getCurrentEmployee(
      user,
      organizationId,
    );

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const filter: Record<string, unknown> = {
      organizationId,
      employeeId: employee._id,
    };

    if (query.status !== undefined) {
      filter.status = query.status;
    }

    if (query.priority !== undefined) {
      filter.priority = query.priority;
    }

    if (query.category !== undefined) {
      filter.category = query.category;
    }

    const [items, total] = await Promise.all([
      this.goalModel
        .find(filter)
        .sort({ dueDate: 1, createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean()
        .exec(),
      this.goalModel.countDocuments(filter).exec(),
    ]);

    return {
      items,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(
    id: string,
    user: AuthenticatedUser,
  ) {
    const organizationId = this.validateObjectId(
      user.organizationId,
      'organizationId',
    );

    const goalId = this.validateObjectId(
      id,
      'goalId',
    );

    const goal = await this.goalModel
      .findOne({
        _id: goalId,
        organizationId,
      })
      .lean()
      .exec();

    if (!goal) {
      throw new NotFoundException('Goal not found');
    }

    return goal;
  }

  async findMineOne(
    id: string,
    user: AuthenticatedUser,
  ) {
    const organizationId = this.validateObjectId(
      user.organizationId,
      'organizationId',
    );

    const goalId = this.validateObjectId(
      id,
      'goalId',
    );

    const employee = await this.getCurrentEmployee(
      user,
      organizationId,
    );

    const goal = await this.goalModel
      .findOne({
        _id: goalId,
        organizationId,
        employeeId: employee._id,
      })
      .lean()
      .exec();

    if (!goal) {
      throw new NotFoundException('Goal not found');
    }

    return goal;
  }

  async findEmployeeGoals(
    employeeId: string,
    query: GoalQueryDto,
    user: AuthenticatedUser,
  ) {
    const organizationId = this.validateObjectId(
      user.organizationId,
      'organizationId',
    );

    const targetEmployeeId = this.validateObjectId(
      employeeId,
      'employeeId',
    );

    await this.getEmployee(
      targetEmployeeId,
      organizationId,
    );

    return this.findAll(
      {
        ...query,
        employeeId: targetEmployeeId.toString(),
      },
      user,
    );
  }

  async update(
    id: string,
    dto: UpdateGoalDto,
    user: AuthenticatedUser,
  ) {
    const organizationId = this.validateObjectId(
      user.organizationId,
      'organizationId',
    );

    const goalId = this.validateObjectId(
      id,
      'goalId',
    );

    const goal = await this.goalModel.findOne({
      _id: goalId,
      organizationId,
    });

    if (!goal) {
      throw new NotFoundException('Goal not found');
    }

    if (
      goal.status === GoalStatus.COMPLETED ||
      goal.status === GoalStatus.CANCELLED
    ) {
      throw new ConflictException(
        `Goal cannot be updated from ${goal.status} status`,
      );
    }

    if (
      dto.startDate !== undefined &&
      dto.dueDate !== undefined &&
      new Date(dto.dueDate) < new Date(dto.startDate)
    ) {
      throw new BadRequestException(
        'dueDate cannot be before startDate',
      );
    }

    if (
      dto.startDate !== undefined &&
      dto.dueDate === undefined &&
      new Date(dto.startDate) > goal.dueDate
    ) {
      throw new BadRequestException(
        'startDate cannot be after dueDate',
      );
    }

    if (
      dto.dueDate !== undefined &&
      dto.startDate === undefined &&
      new Date(dto.dueDate) < goal.startDate
    ) {
      throw new BadRequestException(
        'dueDate cannot be before startDate',
      );
    }

    const previous = {
      title: goal.title,
      description: goal.description,
      category: goal.category,
      priority: goal.priority,
      progress: goal.progress,
      startDate: goal.startDate,
      dueDate: goal.dueDate,
      notes: goal.notes,
    };

    if (dto.title !== undefined) goal.title = dto.title;
    if (dto.description !== undefined) {
      goal.description = dto.description;
    }
    if (dto.category !== undefined) {
      goal.category = dto.category;
    }
    if (dto.priority !== undefined) {
      goal.priority = dto.priority;
    }
    if (dto.progress !== undefined) {
      goal.progress = dto.progress;
    }
    if (dto.startDate !== undefined) {
      goal.startDate = new Date(dto.startDate);
    }
    if (dto.dueDate !== undefined) {
      goal.dueDate = new Date(dto.dueDate);
    }
    if (dto.notes !== undefined) {
      goal.notes = dto.notes;
    }

    const updatedGoal = await goal.save();

    await this.auditLogsService.record({
      user,
      action: AuditAction.UPDATE,
      entity: AuditEntity.GOAL,
      entityId: updatedGoal._id,
      metadata: {
        previous,
        changes: {
          title: dto.title,
          description: dto.description,
          category: dto.category,
          priority: dto.priority,
          progress: dto.progress,
          startDate: dto.startDate,
          dueDate: dto.dueDate,
          notes: dto.notes,
        },
      },
    });

    return updatedGoal;
  }

  async activate(
    id: string,
    user: AuthenticatedUser,
  ) {
    const goal = await this.getGoalForMutation(
      id,
      user,
    );

    if (goal.status !== GoalStatus.DRAFT) {
      throw new ConflictException(
        `Goal cannot be activated from ${goal.status} status`,
      );
    }

    const previousStatus = goal.status;

    goal.status = GoalStatus.ACTIVE;

    const updatedGoal = await goal.save();

    await this.auditLogsService.record({
      user,
      action: AuditAction.UPDATE,
      entity: AuditEntity.GOAL,
      entityId: updatedGoal._id,
      metadata: {
        previousStatus,
        newStatus: GoalStatus.ACTIVE,
      },
    });

    return updatedGoal;
  }

  async complete(
    id: string,
    user: AuthenticatedUser,
  ) {
    const goal = await this.getGoalForMutation(
      id,
      user,
    );

    if (goal.status !== GoalStatus.ACTIVE) {
      throw new ConflictException(
        `Goal cannot be completed from ${goal.status} status`,
      );
    }

    const previousStatus = goal.status;
    const completedAt = new Date();

    goal.status = GoalStatus.COMPLETED;
    goal.progress = 100;
    goal.completedBy = this.validateObjectId(
      user.userId,
      'userId',
    );
    goal.completedAt = completedAt;

    const updatedGoal = await goal.save();

    await this.auditLogsService.record({
      user,
      action: AuditAction.UPDATE,
      entity: AuditEntity.GOAL,
      entityId: updatedGoal._id,
      metadata: {
        previousStatus,
        newStatus: GoalStatus.COMPLETED,
        progress: 100,
        completedAt: completedAt.toISOString(),
      },
    });

    return updatedGoal;
  }

  async cancel(
    id: string,
    user: AuthenticatedUser,
  ) {
    const goal = await this.getGoalForMutation(
      id,
      user,
    );

    if (
      goal.status !== GoalStatus.DRAFT &&
      goal.status !== GoalStatus.ACTIVE
    ) {
      throw new ConflictException(
        `Goal cannot be cancelled from ${goal.status} status`,
      );
    }

    const previousStatus = goal.status;

    goal.status = GoalStatus.CANCELLED;

    const updatedGoal = await goal.save();

    await this.auditLogsService.record({
      user,
      action: AuditAction.CANCEL,
      entity: AuditEntity.GOAL,
      entityId: updatedGoal._id,
      metadata: {
        previousStatus,
        newStatus: GoalStatus.CANCELLED,
      },
    });

    return updatedGoal;
  }

  private async getGoalForMutation(
    id: string,
    user: AuthenticatedUser,
  ): Promise<GoalDocument> {
    const organizationId = this.validateObjectId(
      user.organizationId,
      'organizationId',
    );

    const goalId = this.validateObjectId(
      id,
      'goalId',
    );

    const goal = await this.goalModel.findOne({
      _id: goalId,
      organizationId,
    });

    if (!goal) {
      throw new NotFoundException('Goal not found');
    }

    return goal;
  }

  private async getCurrentEmployee(
    user: AuthenticatedUser,
    organizationId: Types.ObjectId,
  ): Promise<EmployeeDocument> {
    const userId = this.validateObjectId(
      user.userId,
      'userId',
    );

    const employee = await this.employeeModel.findOne({
      organizationId,
      userId,
      isActive: true,
    });

    if (!employee) {
      throw new NotFoundException(
        'Current employee record not found',
      );
    }

    return employee;
  }

  private async getEmployee(
    employeeId: Types.ObjectId,
    organizationId: Types.ObjectId,
  ): Promise<EmployeeDocument> {
    const employee = await this.employeeModel.findOne({
      _id: employeeId,
      organizationId,
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    return employee;
  }

  private validateObjectId(
    value: string,
    field: string,
  ): Types.ObjectId {
    if (!Types.ObjectId.isValid(value)) {
      throw new BadRequestException(
        `Invalid ${field}`,
      );
    }

    return new Types.ObjectId(value);
  }
}
