import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { CareerEventsService } from '../career-events/career-events.service.js';
import {
  CareerEventType,
} from '../career-events/schemas/career-event.schema.js';
import {
  Model,
  Types,
} from 'mongoose';
import { User } from '../users/schemas/user.schema.js';
import { CreateEmployeeDto } from './dto/create-employee.dto.js';
import {
  EmployeeQueryDto,
} from './dto/employee-query.dto.js';
import {
  UpdateEmployeeDto,
} from './dto/update-employee.dto.js';
import { Employee } from './schemas/employee.schema.js';

@Injectable()
export class EmployeesService {
  constructor(
    @InjectModel(Employee.name)
    private readonly employeeModel: Model<Employee>,

    @InjectModel(User.name)
    private readonly userModel: Model<User>,

    private readonly careerEventsService: CareerEventsService,
  ) {}

  async create(
    organizationId: string,
    dto: CreateEmployeeDto,
    createdBy: string,
  ) {
    const organizationObjectId =
      this.toObjectId(organizationId);

    const userObjectId =
      this.toObjectId(dto.userId);

    const user = await this.userModel
      .findOne({
        _id: userObjectId,
        organizationId: organizationObjectId,
      })
      .exec();

    if (!user) {
      throw new NotFoundException(
        'User not found in this organization',
      );
    }

    const existingEmployee =
      await this.employeeModel
        .findOne({
          $or: [
            {
              userId: userObjectId,
            },
            {
              organizationId:
                organizationObjectId,
              employeeCode:
                dto.employeeCode,
            },
            ...(dto.workEmail
              ? [
                  {
                    organizationId:
                      organizationObjectId,
                    workEmail:
                      dto.workEmail
                        .trim()
                        .toLowerCase(),
                  },
                ]
              : []),
          ],
        })
        .exec();

    if (existingEmployee) {
      throw new ConflictException(
        'An employee with the same user, employee code, or work email already exists',
      );
    }

    if (dto.managerId) {
      await this.ensureManagerBelongsToOrganization(
        organizationObjectId,
        dto.managerId,
      );
    }

    try {
      const employee =
        await this.employeeModel.create({
          organizationId:
            organizationObjectId,

          userId:
            userObjectId,

          employeeCode:
            dto.employeeCode.trim(),

          firstName:
            dto.firstName.trim(),

          lastName:
            dto.lastName.trim(),

          middleName:
            dto.middleName?.trim(),

          workEmail:
            dto.workEmail
              ?.trim()
              .toLowerCase(),

          phone:
            dto.phone?.trim(),

          jobTitle:
            dto.jobTitle?.trim(),

          departmentId:
            dto.departmentId
              ? this.toObjectId(
                  dto.departmentId,
                )
              : undefined,

          teamId:
            dto.teamId
              ? this.toObjectId(
                  dto.teamId,
                )
              : undefined,

          managerId:
            dto.managerId
              ? this.toObjectId(
                  dto.managerId,
                )
              : undefined,

          employmentType:
            dto.employmentType,

          employmentStatus:
            'ACTIVE',

          joiningDate:
            new Date(dto.joiningDate),

          location:
            dto.location?.trim(),

          workMode:
            dto.workMode?.trim(),

          designation:
            dto.designation?.trim(),
        });

      await this.careerEventsService.create(
        organizationId,
        employee._id.toString(),
        createdBy,
        {
          type: CareerEventType.JOINED,

          title: 'Joined the organization',

          effectiveDate:
            employee.joiningDate,

          metadata: {
            employeeCode:
              employee.employeeCode,

            employmentType:
              employee.employmentType,
          },
        },
      );

      return employee;
    } catch (error) {
      if (
        this.isDuplicateKeyError(error)
      ) {
        throw new ConflictException(
          'An employee with the same unique identifier already exists',
        );
      }

      throw error;
    }
  }

  async findAll(
    organizationId: string,
    query: EmployeeQueryDto,
  ) {
    const organizationObjectId =
      this.toObjectId(organizationId);

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {
      organizationId:
        organizationObjectId,
    };

    if (query.employmentStatus) {
      filter.employmentStatus =
        query.employmentStatus;
    }

    if (query.departmentId) {
      filter.departmentId =
        this.toObjectId(
          query.departmentId,
        );
    }

    if (query.teamId) {
      filter.teamId =
        this.toObjectId(
          query.teamId,
        );
    }

    if (query.search) {
      const search =
        this.escapeRegex(
          query.search.trim(),
        );

      filter.$or = [
        {
          employeeCode: {
            $regex: search,
            $options: 'i',
          },
        },
        {
          firstName: {
            $regex: search,
            $options: 'i',
          },
        },
        {
          lastName: {
            $regex: search,
            $options: 'i',
          },
        },
        {
          workEmail: {
            $regex: search,
            $options: 'i',
          },
        },
        {
          jobTitle: {
            $regex: search,
            $options: 'i',
          },
        },
        {
          designation: {
            $regex: search,
            $options: 'i',
          },
        },
      ];
    }

    const [
      employees,
      total,
    ] = await Promise.all([
      this.employeeModel
        .find(filter)
        .sort({
          createdAt: -1,
        })
        .skip(skip)
        .limit(limit)
        .exec(),

      this.employeeModel
        .countDocuments(filter)
        .exec(),
    ]);

    return {
      data: employees,

      meta: {
        page,
        limit,
        total,
        totalPages:
          Math.ceil(total / limit),
      },
    };
  }

  async findOne(
    organizationId: string,
    employeeId: string,
  ) {
    const employee =
      await this.employeeModel
        .findOne({
          _id: this.toObjectId(
            employeeId,
          ),

          organizationId:
            this.toObjectId(
              organizationId,
            ),
        })
        .exec();

    if (!employee) {
      throw new NotFoundException(
        'Employee not found',
      );
    }

    return employee;
  }

  async find360(
    organizationId: string,
    employeeId: string,
  ) {
    const organizationObjectId =
      this.toObjectId(organizationId);

    const employeeObjectId =
      this.toObjectId(employeeId);

    const employee =
      await this.employeeModel
        .findOne({
          _id: employeeObjectId,
          organizationId:
            organizationObjectId,
        })
        .lean()
        .exec();

    if (!employee) {
      throw new NotFoundException(
        'Employee not found',
      );
    }

    const [
      user,
      manager,
      careerTimeline,
    ] = await Promise.all([
      this.userModel
        .findOne({
          _id: employee.userId,
          organizationId:
            organizationObjectId,
        })
        .select(
          'email firstName lastName status emailVerified roleId lastLoginAt',
        )
        .lean()
        .exec(),

      employee.managerId
        ? this.employeeModel
            .findOne({
              _id: employee.managerId,
              organizationId:
                organizationObjectId,
            })
            .select(
              'employeeCode firstName middleName lastName workEmail jobTitle designation employmentStatus',
            )
            .lean()
            .exec()
        : null,

      this.careerEventsService.findByEmployee(
        organizationId,
        employeeId,
      ),
    ]);

    if (!user) {
      throw new NotFoundException(
        'Employee user not found in this organization',
      );
    }

    return {
      employee,

      user,

      organization: {
        organizationId,
      },

      department: employee.departmentId
        ? {
            departmentId:
              employee.departmentId.toString(),
          }
        : null,

      team: employee.teamId
        ? {
            teamId:
              employee.teamId.toString(),
          }
        : null,

      manager,

      careerTimeline,
    };
  }

  async findCareerTimeline(
    organizationId: string,
    employeeId: string,
  ) {
    await this.findOne(
      organizationId,
      employeeId,
    );

    return this.careerEventsService.findByEmployee(
      organizationId,
      employeeId,
    );
  }

  async update(
    organizationId: string,
    employeeId: string,
    dto: UpdateEmployeeDto,
    updatedBy: string,
  ) {
    const organizationObjectId =
      this.toObjectId(organizationId);

    const employeeObjectId =
      this.toObjectId(employeeId);

    const employee =
      await this.employeeModel
        .findOne({
          _id: employeeObjectId,

          organizationId:
            organizationObjectId,
        })
        .exec();

    if (!employee) {
      throw new NotFoundException(
        'Employee not found',
      );
    }

    if (dto.managerId) {
      await this.ensureManagerBelongsToOrganization(
        organizationObjectId,
        dto.managerId,
      );

      if (
        dto.managerId === employeeId
      ) {
        throw new ConflictException(
          'An employee cannot be their own manager',
        );
      }
    }

    const oldValues = {
      designation:
        employee.designation,

      departmentId:
        employee.departmentId?.toString(),

      teamId:
        employee.teamId?.toString(),

      managerId:
        employee.managerId?.toString(),

      employmentType:
        employee.employmentType,

      location:
        employee.location,

      workMode:
        employee.workMode,

      employmentStatus:
        employee.employmentStatus,
    };

    const update: Record<
      string,
      unknown
    > = {};

    if (dto.firstName !== undefined) {
      update.firstName =
        dto.firstName.trim();
    }

    if (dto.lastName !== undefined) {
      update.lastName =
        dto.lastName.trim();
    }

    if (dto.middleName !== undefined) {
      update.middleName =
        dto.middleName.trim();
    }

    if (dto.workEmail !== undefined) {
      update.workEmail =
        dto.workEmail
          .trim()
          .toLowerCase();
    }

    if (dto.phone !== undefined) {
      update.phone =
        dto.phone.trim();
    }

    if (dto.jobTitle !== undefined) {
      update.jobTitle =
        dto.jobTitle.trim();
    }

    if (dto.departmentId !== undefined) {
      update.departmentId =
        this.toObjectId(
          dto.departmentId,
        );
    }

    if (dto.teamId !== undefined) {
      update.teamId =
        this.toObjectId(
          dto.teamId,
        );
    }

    if (dto.managerId !== undefined) {
      update.managerId =
        this.toObjectId(
          dto.managerId,
        );
    }

    if (dto.employmentType !== undefined) {
      update.employmentType =
        dto.employmentType;
    }

    if (dto.joiningDate !== undefined) {
      update.joiningDate =
        new Date(dto.joiningDate);
    }

    if (dto.location !== undefined) {
      update.location =
        dto.location.trim();
    }

    if (dto.workMode !== undefined) {
      update.workMode =
        dto.workMode.trim();
    }

    if (dto.designation !== undefined) {
      update.designation =
        dto.designation.trim();
    }

    try {
      const updated =
        await this.employeeModel
          .findOneAndUpdate(
            {
              _id: employeeObjectId,

              organizationId:
                organizationObjectId,
            },
            {
              $set: update,
            },
            {
              new: true,
              runValidators: true,
            },
          )
          .exec();

      if (!updated) {
        throw new NotFoundException(
          'Employee not found',
        );
      }

      const newValues = {
        designation:
          updated.designation,

        departmentId:
          updated.departmentId?.toString(),

        teamId:
          updated.teamId?.toString(),

        managerId:
          updated.managerId?.toString(),

        employmentType:
          updated.employmentType,

        location:
          updated.location,

        workMode:
          updated.workMode,

        employmentStatus:
          updated.employmentStatus,
      };

      const changes = [
        {
          type:
            CareerEventType.DESIGNATION_CHANGE,
          title:
            'Designation changed',
          oldValue:
            oldValues.designation,
          newValue:
            newValues.designation,
        },

        {
          type:
            CareerEventType.DEPARTMENT_CHANGE,
          title:
            'Department changed',
          oldValue:
            oldValues.departmentId,
          newValue:
            newValues.departmentId,
        },

        {
          type:
            CareerEventType.TEAM_CHANGE,
          title:
            'Team changed',
          oldValue:
            oldValues.teamId,
          newValue:
            newValues.teamId,
        },

        {
          type:
            CareerEventType.MANAGER_CHANGE,
          title:
            'Manager changed',
          oldValue:
            oldValues.managerId,
          newValue:
            newValues.managerId,
        },

        {
          type:
            CareerEventType.EMPLOYMENT_TYPE_CHANGE,
          title:
            'Employment type changed',
          oldValue:
            oldValues.employmentType,
          newValue:
            newValues.employmentType,
        },

        {
          type:
            CareerEventType.LOCATION_CHANGE,
          title:
            'Location changed',
          oldValue:
            oldValues.location,
          newValue:
            newValues.location,
        },

        {
          type:
            CareerEventType.WORK_MODE_CHANGE,
          title:
            'Work mode changed',
          oldValue:
            oldValues.workMode,
          newValue:
            newValues.workMode,
        },

        {
          type:
            CareerEventType.STATUS_CHANGE,
          title:
            'Employment status changed',
          oldValue:
            oldValues.employmentStatus,
          newValue:
            newValues.employmentStatus,
        },
      ];

      for (const change of changes) {
        if (
          this.valuesAreDifferent(
            change.oldValue,
            change.newValue,
          )
        ) {
          await this.careerEventsService.recordChange(
            organizationId,
            employeeId,
            updatedBy,
            {
              type: change.type,
              title: change.title,
              oldValue:
                change.oldValue,
              newValue:
                change.newValue,
              effectiveDate:
                new Date(),
            },
          );
        }
      }

      return updated;
    } catch (error) {
      if (
        this.isDuplicateKeyError(error)
      ) {
        throw new ConflictException(
          'An employee with the same unique identifier already exists',
        );
      }

      throw error;
    }
  }

  async deactivate(
  organizationId: string,
  employeeId: string,
  updatedBy: string,
) {
  const organizationObjectId =
    this.toObjectId(organizationId);

  const employeeObjectId =
    this.toObjectId(employeeId);

  const existingEmployee =
    await this.employeeModel
      .findOne({
        _id: employeeObjectId,
        organizationId: organizationObjectId,
      })
      .exec();

  if (!existingEmployee) {
    throw new NotFoundException(
      'Employee not found',
    );
  }

  // Already terminated — do not create another EXITED event.
  if (existingEmployee.employmentStatus === 'TERMINATED') {
    return existingEmployee;
  }

  const exitDate = new Date();

  const employee =
    await this.employeeModel
      .findOneAndUpdate(
        {
          _id: employeeObjectId,
          organizationId: organizationObjectId,
        },
        {
          $set: {
            employmentStatus: 'TERMINATED',
            exitDate,
          },
        },
        {
          new: true,
        },
      )
      .exec();

  if (!employee) {
    throw new NotFoundException(
      'Employee not found',
    );
  }

  await this.careerEventsService.create(
    organizationId,
    employeeId,
    updatedBy,
    {
      type: CareerEventType.EXITED,

      title:
        'Exited the organization',

      effectiveDate: exitDate,

      metadata: {
        previousStatus:
          existingEmployee.employmentStatus,

        newStatus:
          employee.employmentStatus,
      },
    },
  );

  return employee;
}

  private async ensureManagerBelongsToOrganization(
    organizationId: Types.ObjectId,
    managerId: string,
  ) {
    const manager =
      await this.employeeModel
        .findOne({
          _id: this.toObjectId(
            managerId,
          ),

          organizationId,
        })
        .select('_id')
        .lean()
        .exec();

    if (!manager) {
      throw new NotFoundException(
        'Manager not found in this organization',
      );
    }
  }

  private valuesAreDifferent(
    oldValue: unknown,
    newValue: unknown,
  ): boolean {
    return (
      String(oldValue ?? '') !==
      String(newValue ?? '')
    );
  }

  private toObjectId(
    value: string,
  ): Types.ObjectId {
    return new Types.ObjectId(value);
  }

  private escapeRegex(
    value: string,
  ): string {
    return value.replace(
      /[.*+?^${}()|[\]\\]/g,
      '\\$&',
    );
  }

  private isDuplicateKeyError(
    error: unknown,
  ): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 11000
    );
  }
}