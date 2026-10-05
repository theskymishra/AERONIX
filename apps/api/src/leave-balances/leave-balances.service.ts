import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { Employee } from '../employees/schemas/employee.schema.js';
import {
  LeaveRequest,
  LeaveRequestStatus,
} from '../leave-requests/schemas/leave-request.schema.js';
import { LeaveType } from '../leave-types/schemas/leave-type.schema.js';

import { LeaveBalanceQueryDto } from './dto/leave-balance-query.dto.js';
import type { AuthenticatedUser } from '../auth/strategies/jwt-access.strategy.js';

@Injectable()
export class LeaveBalancesService {
  constructor(
    @InjectModel(Employee.name)
    private readonly employeeModel: Model<Employee>,

    @InjectModel(LeaveType.name)
    private readonly leaveTypeModel: Model<LeaveType>,

    @InjectModel(LeaveRequest.name)
    private readonly leaveRequestModel: Model<LeaveRequest>,
  ) {}

  async findMine(
    query: LeaveBalanceQueryDto,
    user: AuthenticatedUser,
  ) {
    const organizationId = this.toObjectId(
      user.organizationId,
    );

    const employee = await this.employeeModel
      .findOne({
        organizationId,
        userId: this.toObjectId(user.userId),
      })
      .select('_id')
      .lean()
      .exec();

    if (!employee) {
      throw new NotFoundException(
        'Employee profile not found for the authenticated user',
      );
    }

    return this.calculateForEmployee(
      organizationId,
      employee._id,
      query.year,
    );
  }

  async findTeam(
    query: LeaveBalanceQueryDto,
    user: AuthenticatedUser,
  ) {
    const organizationId = this.toObjectId(
      user.organizationId,
    );

    const manager = await this.employeeModel
      .findOne({
        organizationId,
        userId: this.toObjectId(user.userId),
      })
      .select('_id')
      .lean()
      .exec();

    if (!manager) {
      throw new NotFoundException(
        'Employee profile not found for the authenticated user',
      );
    }

    const employees = await this.employeeModel
      .find({
        organizationId,
        managerId: manager._id,
      })
      .select('_id employeeCode firstName lastName')
      .sort({ employeeCode: 1 })
      .lean()
      .exec();

    const results = await Promise.all(
      employees.map((employee) =>
        this.calculateForEmployee(
          organizationId,
          employee._id,
          query.year,
          {
            employeeCode: employee.employeeCode,
            firstName: employee.firstName,
            lastName: employee.lastName,
          },
        ),
      ),
    );

    return {
      year:
        query.year ??
        new Date().getUTCFullYear(),
      employees: results,
    };
  }

  async findAll(
    query: LeaveBalanceQueryDto,
    user: AuthenticatedUser,
  ) {
    const organizationId = this.toObjectId(
      user.organizationId,
    );

    if (query.employeeId) {
      const employeeId = this.toObjectId(
        query.employeeId,
      );

      const employee = await this.employeeModel
        .findOne({
          _id: employeeId,
          organizationId,
        })
        .select(
          '_id employeeCode firstName lastName',
        )
        .lean()
        .exec();

      if (!employee) {
        throw new NotFoundException(
          'Employee not found',
        );
      }

      return this.calculateForEmployee(
        organizationId,
        employee._id,
        query.year,
        {
          employeeCode: employee.employeeCode,
          firstName: employee.firstName,
          lastName: employee.lastName,
        },
      );
    }

    const employees = await this.employeeModel
      .find({ organizationId })
      .select(
        '_id employeeCode firstName lastName',
      )
      .sort({ employeeCode: 1 })
      .lean()
      .exec();

    const results = await Promise.all(
      employees.map((employee) =>
        this.calculateForEmployee(
          organizationId,
          employee._id,
          query.year,
          {
            employeeCode: employee.employeeCode,
            firstName: employee.firstName,
            lastName: employee.lastName,
          },
        ),
      ),
    );

    return {
      year:
        query.year ??
        new Date().getUTCFullYear(),
      employees: results,
    };
  }

  private async calculateForEmployee(
    organizationId: Types.ObjectId,
    employeeId: Types.ObjectId,
    requestedYear?: number,
    employeeDetails?: {
      employeeCode?: string;
      firstName?: string;
      lastName?: string;
    },
  ) {
    const year =
      requestedYear ??
      new Date().getUTCFullYear();

    const yearStart = new Date(
      Date.UTC(year, 0, 1),
    );

    const yearEnd = new Date(
      Date.UTC(year + 1, 0, 1),
    );

    const leaveTypes = await this.leaveTypeModel
      .find({
        organizationId,
        isActive: true,
      })
      .sort({ name: 1 })
      .lean()
      .exec();

    const balances = await Promise.all(
      leaveTypes.map(async (leaveType) => {
        const currentYearRequests =
          await this.leaveRequestModel
            .find({
              organizationId,
              employeeId,
              leaveTypeId: leaveType._id,
              startDate: {
                $gte: yearStart,
                $lt: yearEnd,
              },
            })
            .select(
              'status totalDays startDate endDate',
            )
            .lean()
            .exec();

        const usedDays =
          currentYearRequests
            .filter(
              (request) =>
                request.status ===
                LeaveRequestStatus.APPROVED,
            )
            .reduce(
              (sum, request) =>
                sum + request.totalDays,
              0,
            );

        const pendingDays =
          currentYearRequests
            .filter(
              (request) =>
                request.status ===
                LeaveRequestStatus.PENDING,
            )
            .reduce(
              (sum, request) =>
                sum + request.totalDays,
              0,
            );

        /*
         * Carry-forward is currently zero because the system
         * does not yet persist a previous year's closing balance.
         *
         * This prevents the system from incorrectly granting
         * carry-forward days merely because no previous-year
         * leave requests exist.
         *
         * Historical carry-forward can be introduced later
         * through yearly leave-balance snapshots.
         */
        const carryForwardDays = 0;

        const allocatedDays =
          leaveType.annualAllocation;

        const remainingDays = Math.max(
          0,
          allocatedDays +
            carryForwardDays -
            usedDays,
        );

        const availableToRequest = Math.max(
          0,
          remainingDays -
            pendingDays,
        );

        return {
          leaveTypeId:
            leaveType._id.toString(),
          code: leaveType.code,
          name: leaveType.name,
          isPaid: leaveType.isPaid,
          annualAllocation: allocatedDays,
          carryForwardAllowed:
            leaveType.carryForwardAllowed,
          carryForwardDays,
          usedDays,
          pendingDays,
          remainingDays,
          availableToRequest,
        };
      }),
    );

    return {
      employeeId: employeeId.toString(),
      ... employeeDetails ,
      year,
      balances,
    };
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