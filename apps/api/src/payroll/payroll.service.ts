
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import {
  Employee,
  EmployeeDocument,
} from '../employees/schemas/employee.schema.js';

import {
  AuditAction,
  AuditEntity,
} from '../audit-logs/schemas/audit-log.schema.js';

import { AuditLogsService } from '../audit-logs/audit-logs.service.js';

import {
  PayrollRecord,
  PayrollRecordDocument,
  PayrollStatus,
} from './schemas/payroll-record.schema.js';

import { CreatePayrollRecordDto } from './dto/create-payroll-record.dto.js';
import { PayrollQueryDto } from './dto/payroll-query.dto.js';
import { UpdatePayrollRecordDto } from './dto/update-payroll-record.dto.js';
import { PayrollSelfQueryDto } from './dto/payroll-self-query.dto.js';

interface AuthenticatedUser {
  userId: string;
  organizationId: string;
}

@Injectable()
export class PayrollService {
  constructor(
    @InjectModel(PayrollRecord.name)
    private readonly payrollModel: Model<PayrollRecordDocument>,

    @InjectModel(Employee.name)
    private readonly employeeModel: Model<EmployeeDocument>,

    private readonly auditLogsService: AuditLogsService,
  ) {}

  private validateObjectId(
    value: string,
    field: string,
  ): Types.ObjectId {
    if (!Types.ObjectId.isValid(value)) {
      throw new NotFoundException(`Invalid ${field}`);
    }

    return new Types.ObjectId(value);
  }

  private calculateSalary(
    basicSalary: number,
    allowances = 0,
    deductions = 0,
  ) {
    const grossSalary = basicSalary + allowances;
    const netSalary = Math.max(
      0,
      grossSalary - deductions,
    );

    return {
      grossSalary,
      netSalary,
    };
  }

  async create(
    employeeId: string,
    dto: CreatePayrollRecordDto,
    user: AuthenticatedUser,
  ) {
    const organizationId = this.validateObjectId(
      user.organizationId,
      'organizationId',
    );

    const employeeObjectId = this.validateObjectId(
      employeeId,
      'employeeId',
    );

    const employee = await this.employeeModel
      .findOne({
        _id: employeeObjectId,
        organizationId,
      })
      .lean();

    if (!employee) {
      throw new NotFoundException(
        'Employee not found',
      );
    }

    const existing = await this.payrollModel.exists({
      organizationId,
      employeeId: employeeObjectId,
      payPeriod: dto.payPeriod,
    });

    if (existing) {
      throw new ConflictException(
        'Payroll record already exists for this employee and pay period',
      );
    }

    const allowances = dto.allowances ?? 0;
    const deductions = dto.deductions ?? 0;

    const {
      grossSalary,
      netSalary,
    } = this.calculateSalary(
      dto.basicSalary,
      allowances,
      deductions,
    );

    const createdRecord =
      await this.payrollModel.create({
        organizationId,
        employeeId: employeeObjectId,
        payPeriod: dto.payPeriod,
        status: PayrollStatus.DRAFT,
        basicSalary: dto.basicSalary,
        allowances,
        deductions,
        grossSalary,
        netSalary,
        createdBy: this.validateObjectId(
          user.userId,
          'userId',
        ),
        notes: dto.notes,
      });

    await this.auditLogsService.record({
      user,
      action: AuditAction.CREATE,
      entity: AuditEntity.PAYROLL,
      entityId: createdRecord._id,
      metadata: {
        employeeId:
          employeeObjectId.toString(),
        payPeriod: createdRecord.payPeriod,
        status: createdRecord.status,
        basicSalary:
          createdRecord.basicSalary,
        allowances:
          createdRecord.allowances,
        deductions:
          createdRecord.deductions,
        grossSalary:
          createdRecord.grossSalary,
        netSalary:
          createdRecord.netSalary,
      },
    });

    return createdRecord;
  }

  async findAll(
    query: PayrollQueryDto,
    user: AuthenticatedUser,
  ) {
    const organizationId =
      this.validateObjectId(
        user.organizationId,
        'organizationId',
      );

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = {
      organizationId,
    };

    if (query.employeeId) {
      filter.employeeId =
        this.validateObjectId(
          query.employeeId,
          'employeeId',
        );
    }

    if (query.payPeriod) {
      filter.payPeriod = query.payPeriod;
    }

    if (query.status) {
      filter.status = query.status;
    }

    const [records, total] =
      await Promise.all([
        this.payrollModel
          .find(filter)
          .sort({
            payPeriod: -1,
            createdAt: -1,
          })
          .skip(skip)
          .limit(limit)
          .lean(),

        this.payrollModel.countDocuments(
          filter,
        ),
      ]);

    return {
      data: records,
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
      this.validateObjectId(
        user.organizationId,
        'organizationId',
      );

    const payrollId =
      this.validateObjectId(
        id,
        'payrollId',
      );

    const record = await this.payrollModel
      .findOne({
        _id: payrollId,
        organizationId,
      })
      .lean();

    if (!record) {
      throw new NotFoundException(
        'Payroll record not found',
      );
    }

    return record;
  }

  async update(
    id: string,
    dto: UpdatePayrollRecordDto,
    user: AuthenticatedUser,
  ) {
    const organizationId =
      this.validateObjectId(
        user.organizationId,
        'organizationId',
      );

    const payrollId =
      this.validateObjectId(
        id,
        'payrollId',
      );

    const record =
      await this.payrollModel.findOne({
        _id: payrollId,
        organizationId,
      });

    if (!record) {
      throw new NotFoundException(
        'Payroll record not found',
      );
    }

    if (
      record.status !==
      PayrollStatus.DRAFT
    ) {
      throw new ConflictException(
        'Only DRAFT payroll records can be edited',
      );
    }

    if (dto.payPeriod !== undefined) {
      record.payPeriod = dto.payPeriod;
    }

    if (dto.basicSalary !== undefined) {
      record.basicSalary =
        dto.basicSalary;
    }

    if (dto.allowances !== undefined) {
      record.allowances =
        dto.allowances;
    }

    if (dto.deductions !== undefined) {
      record.deductions =
        dto.deductions;
    }

    if (dto.notes !== undefined) {
      record.notes = dto.notes;
    }

    const {
      grossSalary,
      netSalary,
    } = this.calculateSalary(
      record.basicSalary,
      record.allowances,
      record.deductions,
    );

    record.grossSalary = grossSalary;
    record.netSalary = netSalary;

    try {
      const updatedRecord =
        await record.save();

      await this.auditLogsService.record({
        user,
        action: AuditAction.UPDATE,
        entity: AuditEntity.PAYROLL,
        entityId: updatedRecord._id,
        metadata: {
          payPeriod:
            updatedRecord.payPeriod,
          status:
            updatedRecord.status,
          basicSalary:
            updatedRecord.basicSalary,
          allowances:
            updatedRecord.allowances,
          deductions:
            updatedRecord.deductions,
          grossSalary:
            updatedRecord.grossSalary,
          netSalary:
            updatedRecord.netSalary,
        },
      });

      return updatedRecord;
    } catch (error: unknown) {
      if (
        error instanceof Error &&
        'code' in error &&
        error.code === 11000
      ) {
        throw new ConflictException(
          'Payroll record already exists for this employee and pay period',
        );
      }

      throw error;
    }
  }

  async process(
    id: string,
    user: AuthenticatedUser,
    notes?: string,
  ) {
    const organizationId =
      this.validateObjectId(
        user.organizationId,
        'organizationId',
      );

    const payrollId =
      this.validateObjectId(
        id,
        'payrollId',
      );

    const record =
      await this.payrollModel.findOne({
        _id: payrollId,
        organizationId,
      });

    if (!record) {
      throw new NotFoundException(
        'Payroll record not found',
      );
    }

    if (
      record.status !==
      PayrollStatus.DRAFT
    ) {
      throw new ConflictException(
        `Payroll cannot be processed from ${record.status} status`,
      );
    }

    const previousStatus =
      record.status;

    record.status =
      PayrollStatus.PROCESSED;

    record.processedBy =
      this.validateObjectId(
        user.userId,
        'userId',
      );

    record.processedAt = new Date();

    if (notes !== undefined) {
      record.notes = notes;
    }

    const processedRecord =
      await record.save();

    await this.auditLogsService.record({
      user,
      action: AuditAction.UPDATE,
      entity: AuditEntity.PAYROLL,
      entityId: processedRecord._id,
      metadata: {
        previousStatus,
        newStatus:
          PayrollStatus.PROCESSED,
        processedAt:
          processedRecord.processedAt?.toISOString(),
        notes,
      },
    });

    return processedRecord;
  }

  async approve(
    id: string,
    user: AuthenticatedUser,
    notes?: string,
  ) {
    const organizationId =
      this.validateObjectId(
        user.organizationId,
        'organizationId',
      );

    const payrollId =
      this.validateObjectId(
        id,
        'payrollId',
      );

    const record =
      await this.payrollModel.findOne({
        _id: payrollId,
        organizationId,
      });

    if (!record) {
      throw new NotFoundException(
        'Payroll record not found',
      );
    }

    if (
      record.status !==
      PayrollStatus.PROCESSED
    ) {
      throw new ConflictException(
        `Payroll cannot be approved from ${record.status} status`,
      );
    }

    const previousStatus =
      record.status;

    record.status =
      PayrollStatus.APPROVED;

    record.approvedBy =
      this.validateObjectId(
        user.userId,
        'userId',
      );

    record.approvedAt = new Date();

    if (notes !== undefined) {
      record.notes = notes;
    }

    const approvedRecord =
      await record.save();

    await this.auditLogsService.record({
      user,
      action: AuditAction.APPROVE,
      entity: AuditEntity.PAYROLL,
      entityId: approvedRecord._id,
      metadata: {
        previousStatus,
        newStatus:
          PayrollStatus.APPROVED,
        approvedAt:
          approvedRecord.approvedAt?.toISOString(),
        notes,
      },
    });

    return approvedRecord;
  }

  async markPaid(
    id: string,
    user: AuthenticatedUser,
    notes?: string,
  ) {
    const organizationId =
      this.validateObjectId(
        user.organizationId,
        'organizationId',
      );

    const payrollId =
      this.validateObjectId(
        id,
        'payrollId',
      );

    const record =
      await this.payrollModel.findOne({
        _id: payrollId,
        organizationId,
      });

    if (!record) {
      throw new NotFoundException(
        'Payroll record not found',
      );
    }

    if (
      record.status !==
      PayrollStatus.APPROVED
    ) {
      throw new ConflictException(
        `Payroll cannot be marked as paid from ${record.status} status`,
      );
    }

    const previousStatus =
      record.status;

    record.status =
      PayrollStatus.PAID;

    record.paidBy =
      this.validateObjectId(
        user.userId,
        'userId',
      );

    record.paidAt = new Date();

    if (notes !== undefined) {
      record.notes = notes;
    }

    const paidRecord =
      await record.save();

    await this.auditLogsService.record({
      user,
      action: AuditAction.UPDATE,
      entity: AuditEntity.PAYROLL,
      entityId: paidRecord._id,
      metadata: {
        previousStatus,
        newStatus:
          PayrollStatus.PAID,
        paidAt:
          paidRecord.paidAt?.toISOString(),
        notes,
      },
    });

    return paidRecord;
  }

  async cancel(
    id: string,
    user: AuthenticatedUser,
    notes?: string,
  ) {
    const organizationId =
      this.validateObjectId(
        user.organizationId,
        'organizationId',
      );

    const payrollId =
      this.validateObjectId(
        id,
        'payrollId',
      );

    const record =
      await this.payrollModel.findOne({
        _id: payrollId,
        organizationId,
      });

    if (!record) {
      throw new NotFoundException(
        'Payroll record not found',
      );
    }

    if (
      record.status !==
        PayrollStatus.DRAFT &&
      record.status !==
        PayrollStatus.PROCESSED
    ) {
      throw new ConflictException(
        `Payroll record cannot be cancelled from ${record.status} status`,
      );
    }

    const previousStatus =
      record.status;

    const cancelledAt = new Date();

    record.status =
      PayrollStatus.CANCELLED;

    if (notes !== undefined) {
      record.notes = notes;
    }

    const cancelledRecord =
      await record.save();

    await this.auditLogsService.record({
      user,
      action: AuditAction.CANCEL,
      entity: AuditEntity.PAYROLL,
      entityId: cancelledRecord._id,
      metadata: {
        previousStatus,
        newStatus:
          PayrollStatus.CANCELLED,
        cancelledAt:
          cancelledAt.toISOString(),
        notes: notes ?? null,
      },
    });

    return cancelledRecord;
  }

  private async getCurrentEmployee(
    user: AuthenticatedUser,
  ): Promise<EmployeeDocument> {
    const organizationId =
      this.validateObjectId(
        user.organizationId,
        'organizationId',
      );

    const userId =
      this.validateObjectId(
        user.userId,
        'userId',
      );

    const employee =
      await this.employeeModel.findOne({
        organizationId,
        userId,
      });

    if (!employee) {
      throw new NotFoundException(
        'Employee profile not found',
      );
    }

    return employee;
  }

  async findMine(
    query: PayrollSelfQueryDto,
    user: AuthenticatedUser,
  ) {
    const employee =
      await this.getCurrentEmployee(user);

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> =
      {
        organizationId:
          employee.organizationId,
        employeeId: employee._id,
      };

    if (query.payPeriod) {
      filter.payPeriod =
        query.payPeriod;
    }

    if (query.status) {
      filter.status = query.status;
    }

    const [records, total] =
      await Promise.all([
        this.payrollModel
          .find(filter)
          .sort({
            payPeriod: -1,
            createdAt: -1,
          })
          .skip(skip)
          .limit(limit)
          .lean(),

        this.payrollModel.countDocuments(
          filter,
        ),
      ]);

    return {
      data: records,
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

  async findMineOne(
    id: string,
    user: AuthenticatedUser,
  ) {
    const employee =
      await this.getCurrentEmployee(user);

    const payrollId =
      this.validateObjectId(
        id,
        'payrollId',
      );

    const record =
      await this.payrollModel
        .findOne({
          _id: payrollId,
          organizationId:
            employee.organizationId,
          employeeId: employee._id,
        })
        .lean();

    if (!record) {
      throw new NotFoundException(
        'Payroll record not found',
      );
    }

    return record;
  }

  async findEmployeePayroll(
    employeeId: string,
    query: PayrollQueryDto,
    user: AuthenticatedUser,
  ) {
    const organizationId =
      this.validateObjectId(
        user.organizationId,
        'organizationId',
      );

    const employeeObjectId =
      this.validateObjectId(
        employeeId,
        'employeeId',
      );

    const employee =
      await this.employeeModel
        .findOne({
          _id: employeeObjectId,
          organizationId,
        })
        .lean();

    if (!employee) {
      throw new NotFoundException(
        'Employee not found',
      );
    }

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> =
      {
        organizationId,
        employeeId:
          employeeObjectId,
      };

    if (query.payPeriod) {
      filter.payPeriod =
        query.payPeriod;
    }

    if (query.status) {
      filter.status = query.status;
    }

    const [records, total] =
      await Promise.all([
        this.payrollModel
          .find(filter)
          .sort({
            payPeriod: -1,
            createdAt: -1,
          })
          .skip(skip)
          .limit(limit)
          .lean(),

        this.payrollModel.countDocuments(
          filter,
        ),
      ]);

    return {
      data: records,
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
}

