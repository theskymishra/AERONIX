import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { Employee } from '../employees/schemas/employee.schema.js';
import { Attendance } from './schemas/attendance.schema.js';
import { CreateAttendanceDto } from './dto/create-attendance.dto.js';
import { UpdateAttendanceDto } from './dto/update-attendance.dto.js';
import { AttendanceQueryDto } from './dto/attendance-query.dto.js';

@Injectable()
export class AttendanceService {
  constructor(
    @InjectModel(Attendance.name)
    private readonly attendanceModel: Model<Attendance>,

    @InjectModel(Employee.name)
    private readonly employeeModel: Model<Employee>,
  ) {}

  async create(
    organizationId: string,
    employeeId: string,
    recordedBy: string,
    dto: CreateAttendanceDto,
  ) {
    const organizationObjectId =
      this.toObjectId(organizationId);

    const employeeObjectId =
      this.toObjectId(employeeId);

    const recordedByObjectId =
      this.toObjectId(recordedBy);

    await this.ensureEmployeeBelongsToOrganization(
      organizationObjectId,
      employeeObjectId,
    );

    const date = this.normalizeDate(dto.date);

    const existing = await this.attendanceModel
      .findOne({
        organizationId: organizationObjectId,
        employeeId: employeeObjectId,
        date,
      })
      .lean()
      .exec();

    if (existing) {
      throw new ConflictException(
        'Attendance already exists for this employee and date',
      );
    }

    const checkInAt = dto.checkInAt
      ? new Date(dto.checkInAt)
      : undefined;

    const checkOutAt = dto.checkOutAt
      ? new Date(dto.checkOutAt)
      : undefined;

    this.validateTimeRange(checkInAt, checkOutAt);

    try {
      const attendance =
        await this.attendanceModel.create({
          organizationId: organizationObjectId,
          employeeId: employeeObjectId,
          date,
          status: dto.status,
          checkInAt,
          checkOutAt,
          workedMinutes: dto.workedMinutes,
          workMode: dto.workMode,
          notes: dto.notes,
          recordedBy: recordedByObjectId,
        });

      return attendance.toObject();
    } catch (error) {
      if (this.isDuplicateKeyError(error)) {
        throw new ConflictException(
          'Attendance already exists for this employee and date',
        );
      }

      throw error;
    }
  }

  async findAll(
    organizationId: string,
    query: AttendanceQueryDto,
  ) {
    const organizationObjectId =
      this.toObjectId(organizationId);

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = {
      organizationId: organizationObjectId,
    };

    if (query.employeeId) {
      filter.employeeId = this.toObjectId(
        query.employeeId,
      );
    }

    if (query.status) {
      filter.status = query.status;
    }

    if (query.workMode) {
      filter.workMode = query.workMode;
    }

    if (query.fromDate || query.toDate) {
      const dateFilter: Record<string, Date> = {};

      if (query.fromDate) {
        dateFilter.$gte =
          this.normalizeDate(query.fromDate);
      }

      if (query.toDate) {
        dateFilter.$lte =
          this.normalizeDate(query.toDate);
      }

      filter.date = dateFilter;
    }

    const [items, total] = await Promise.all([
      this.attendanceModel
        .find(filter)
        .sort({
          date: -1,
          employeeId: 1,
        })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),

      this.attendanceModel
        .countDocuments(filter)
        .exec(),
    ]);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(
    organizationId: string,
    employeeId: string,
    attendanceId: string,
  ) {
    const organizationObjectId =
      this.toObjectId(organizationId);

    const employeeObjectId =
      this.toObjectId(employeeId);

    const attendanceObjectId =
      this.toObjectId(attendanceId);

    await this.ensureEmployeeBelongsToOrganization(
      organizationObjectId,
      employeeObjectId,
    );

    const attendance =
      await this.attendanceModel
        .findOne({
          _id: attendanceObjectId,
          organizationId: organizationObjectId,
          employeeId: employeeObjectId,
        })
        .lean()
        .exec();

    if (!attendance) {
      throw new NotFoundException(
        'Attendance record not found',
      );
    }

    return attendance;
  }

  async update(
    organizationId: string,
    employeeId: string,
    attendanceId: string,
    dto: UpdateAttendanceDto,
  ) {
    const organizationObjectId =
      this.toObjectId(organizationId);

    const employeeObjectId =
      this.toObjectId(employeeId);

    const attendanceObjectId =
      this.toObjectId(attendanceId);

    await this.ensureEmployeeBelongsToOrganization(
      organizationObjectId,
      employeeObjectId,
    );

    const attendance =
      await this.attendanceModel.findOne({
        _id: attendanceObjectId,
        organizationId: organizationObjectId,
        employeeId: employeeObjectId,
      });

    if (!attendance) {
      throw new NotFoundException(
        'Attendance record not found',
      );
    }

    if (dto.date !== undefined) {
      const normalizedDate =
        this.normalizeDate(dto.date);

      const duplicate =
        await this.attendanceModel
          .findOne({
            _id: { $ne: attendanceObjectId },
            organizationId: organizationObjectId,
            employeeId: employeeObjectId,
            date: normalizedDate,
          })
          .lean()
          .exec();

      if (duplicate) {
        throw new ConflictException(
          'Attendance already exists for this employee and date',
        );
      }

      attendance.date = normalizedDate;
    }

    if (dto.status !== undefined) {
      attendance.status = dto.status;
    }

    if (dto.checkInAt !== undefined) {
      attendance.checkInAt = new Date(
        dto.checkInAt,
      );
    }

    if (dto.checkOutAt !== undefined) {
      attendance.checkOutAt = new Date(
        dto.checkOutAt,
      );
    }

    if (dto.workedMinutes !== undefined) {
      attendance.workedMinutes =
        dto.workedMinutes;
    }

    if (dto.workMode !== undefined) {
      attendance.workMode = dto.workMode;
    }

    if (dto.notes !== undefined) {
      attendance.notes = dto.notes;
    }

    this.validateTimeRange(
      attendance.checkInAt,
      attendance.checkOutAt,
    );

    await attendance.save();

    return attendance.toObject();
  }

  private async ensureEmployeeBelongsToOrganization(
    organizationId: Types.ObjectId,
    employeeId: Types.ObjectId,
  ): Promise<void> {
    const employee =
      await this.employeeModel
        .findOne({
          _id: employeeId,
          organizationId,
        })
        .select('_id')
        .lean()
        .exec();

    if (!employee) {
      throw new NotFoundException(
        'Employee not found',
      );
    }
  }

  private normalizeDate(value: string): Date {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException(
        'Invalid attendance date',
      );
    }

    date.setUTCHours(0, 0, 0, 0);

    return date;
  }

  private validateTimeRange(
    checkInAt?: Date,
    checkOutAt?: Date,
  ): void {
    if (
      checkInAt &&
      checkOutAt &&
      checkOutAt < checkInAt
    ) {
      throw new BadRequestException(
        'Check-out time cannot be earlier than check-in time',
      );
    }
  }

  private toObjectId(value: string): Types.ObjectId {
    if (!Types.ObjectId.isValid(value)) {
      throw new BadRequestException(
        'Invalid MongoDB identifier',
      );
    }

    return new Types.ObjectId(value);
  }

  private isDuplicateKeyError(
    error: unknown,
  ): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code?: number }).code === 11000
    );
  }
}
