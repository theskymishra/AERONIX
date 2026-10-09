import {
  BadRequestException,
  Injectable,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import {
  Attendance,
  AttendanceDocument,
  AttendanceStatus,
} from '../attendance/schemas/attendance.schema.js';
import type { AuthenticatedUser } from '../auth/strategies/jwt-access.strategy.js';
import {
  Employee,
  EmployeeDocument,
} from '../employees/schemas/employee.schema.js';
import {
  Goal,
  GoalDocument,
  GoalStatus,
} from '../goals/schemas/goal.schema.js';
import {
  LeaveRequest,
  LeaveRequestDocument,
  LeaveRequestStatus,
} from '../leave-requests/schemas/leave-request.schema.js';
import {
  PayrollRecord,
  PayrollRecordDocument,
  PayrollStatus,
} from '../payroll/schemas/payroll-record.schema.js';
import {
  PerformanceReview,
  PerformanceReviewDocument,
  PerformanceReviewStatus,
} from '../performance/schemas/performance-review.schema.js';
import {
  Application,
  ApplicationDocument,
  ApplicationStatus,
} from '../recruitment/applications/schemas/application.schema.js';
import {
  Interview,
  InterviewDocument,
  InterviewStatus,
} from '../recruitment/interviews/schemas/interview.schema.js';
import {
  JobOpening,
  JobOpeningDocument,
  JobOpeningStatus,
} from '../recruitment/schemas/job-opening.schema.js';

import {
  DateRangeQueryDto,
  PayrollReportQueryDto,
  ReportExportFormat,
  ReportExportQueryDto,
  ReportExportType,
} from './dto/reports-query.dto.js';

@Injectable()
export class ReportsService {
  constructor(
    @InjectModel(Employee.name)
    private readonly employeeModel: Model<EmployeeDocument>,

    @InjectModel(Attendance.name)
    private readonly attendanceModel: Model<AttendanceDocument>,

    @InjectModel(LeaveRequest.name)
    private readonly leaveRequestModel: Model<LeaveRequestDocument>,

    @InjectModel(PayrollRecord.name)
    private readonly payrollModel: Model<PayrollRecordDocument>,

    @InjectModel(JobOpening.name)
    private readonly jobOpeningModel: Model<JobOpeningDocument>,

    @InjectModel(Application.name)
    private readonly applicationModel: Model<ApplicationDocument>,

    @InjectModel(Interview.name)
    private readonly interviewModel: Model<InterviewDocument>,

    @InjectModel(Goal.name)
    private readonly goalModel: Model<GoalDocument>,

    @InjectModel(PerformanceReview.name)
    private readonly reviewModel: Model<PerformanceReviewDocument>,
  ) {}

  async getHeadcountReport(user: AuthenticatedUser) {
    const organizationId = this.toObjectId(user.organizationId);

    const [
      totalEmployees,
      activeEmployees,
      employees,
    ] = await Promise.all([
      this.employeeModel.countDocuments({ organizationId }).exec(),
      this.employeeModel
        .countDocuments({
          organizationId,
          employmentStatus: 'ACTIVE',
        })
        .exec(),
      this.employeeModel
        .find({ organizationId })
        .select(
          'employmentStatus employmentType workMode departmentId joiningDate',
        )
        .lean()
        .exec(),
    ]);

    const byStatus: Record<string, number> = {};
    const byEmploymentType: Record<string, number> = {};
    const byWorkMode: Record<string, number> = {};
    const byDepartment: Record<string, number> = {};

    let newHiresLast30Days = 0;
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    for (const emp of employees) {
      const status = emp.employmentStatus ?? 'UNKNOWN';
      byStatus[status] = (byStatus[status] ?? 0) + 1;

      if (emp.employmentType) {
        byEmploymentType[emp.employmentType] =
          (byEmploymentType[emp.employmentType] ?? 0) + 1;
      }

      if (emp.workMode) {
        byWorkMode[emp.workMode] =
          (byWorkMode[emp.workMode] ?? 0) + 1;
      }

      if (emp.departmentId) {
        const deptKey = emp.departmentId.toString();
        byDepartment[deptKey] = (byDepartment[deptKey] ?? 0) + 1;
      }

      if (emp.joiningDate && new Date(emp.joiningDate) >= thirtyDaysAgo) {
        newHiresLast30Days += 1;
      }
    }

    return {
      totalEmployees,
      activeEmployees,
      inactiveEmployees: totalEmployees - activeEmployees,
      newHiresLast30Days,
      byStatus,
      byEmploymentType,
      byWorkMode,
      byDepartment,
    };
  }

  async getAttendanceLeaveReport(
    user: AuthenticatedUser,
    query: DateRangeQueryDto,
  ) {
    const organizationId = this.toObjectId(user.organizationId);

    const attendanceFilter: Record<string, unknown> = {
      organizationId,
    };

    const leaveFilter: Record<string, unknown> = {
      organizationId,
    };

    if (query.startDate || query.endDate) {
      const dateRange: Record<string, Date> = {};
      if (query.startDate) {
        dateRange.$gte = new Date(query.startDate);
      }
      if (query.endDate) {
        dateRange.$lte = new Date(query.endDate);
      }
      attendanceFilter.date = dateRange;
      leaveFilter.startDate = dateRange;
    }

    const [attendanceRecords, leaveRequests] = await Promise.all([
      this.attendanceModel
        .find(attendanceFilter)
        .select('status')
        .lean()
        .exec(),
      this.leaveRequestModel
        .find(leaveFilter)
        .select('status leaveTypeId')
        .lean()
        .exec(),
    ]);

    const attendanceCounts: Record<string, number> = {
      [AttendanceStatus.PRESENT]: 0,
      [AttendanceStatus.ABSENT]: 0,
      [AttendanceStatus.LATE]: 0,
      [AttendanceStatus.HALF_DAY]: 0,
      [AttendanceStatus.ON_LEAVE]: 0,
    };

    for (const record of attendanceRecords) {
      if (record.status && attendanceCounts[record.status] !== undefined) {
        attendanceCounts[record.status] += 1;
      }
    }

    const totalAttendanceRecords = attendanceRecords.length;
    const presentRecords =
      attendanceCounts[AttendanceStatus.PRESENT] +
      attendanceCounts[AttendanceStatus.LATE] +
      attendanceCounts[AttendanceStatus.HALF_DAY];

    const attendanceRate =
      totalAttendanceRecords > 0
        ? Math.round((presentRecords / totalAttendanceRecords) * 10000) / 100
        : 100;

    const leaveStatusCounts: Record<string, number> = {
      [LeaveRequestStatus.PENDING]: 0,
      [LeaveRequestStatus.APPROVED]: 0,
      [LeaveRequestStatus.REJECTED]: 0,
      [LeaveRequestStatus.CANCELLED]: 0,
    };

    for (const req of leaveRequests) {
      if (req.status && leaveStatusCounts[req.status] !== undefined) {
        leaveStatusCounts[req.status] += 1;
      }
    }

    return {
      attendance: {
        totalRecords: totalAttendanceRecords,
        attendanceRate,
        counts: attendanceCounts,
      },
      leave: {
        totalRequests: leaveRequests.length,
        statusCounts: leaveStatusCounts,
      },
    };
  }

  async getPayrollReport(
    user: AuthenticatedUser,
    query: PayrollReportQueryDto,
  ) {
    const organizationId = this.toObjectId(user.organizationId);

    const filter: Record<string, unknown> = {
      organizationId,
    };

    if (query.payPeriod) {
      filter.payPeriod = query.payPeriod;
    }

    const records = await this.payrollModel
      .find(filter)
      .select('status basicSalary allowances deductions netSalary payPeriod')
      .lean()
      .exec();

    let totalGrossSalary = 0;
    let totalAllowances = 0;
    let totalDeductions = 0;
    let totalNetSalary = 0;

    const statusCounts: Record<string, number> = {
      [PayrollStatus.DRAFT]: 0,
      [PayrollStatus.PROCESSED]: 0,
      [PayrollStatus.APPROVED]: 0,
      [PayrollStatus.PAID]: 0,
      [PayrollStatus.CANCELLED]: 0,
    };

    for (const record of records) {
      totalGrossSalary += record.basicSalary ?? 0;
      totalAllowances += record.allowances ?? 0;
      totalDeductions += record.deductions ?? 0;
      totalNetSalary += record.netSalary ?? 0;

      if (record.status && statusCounts[record.status] !== undefined) {
        statusCounts[record.status] += 1;
      }
    }

    const count = records.length;
    const averageGrossSalary =
      count > 0 ? Math.round((totalGrossSalary / count) * 100) / 100 : 0;
    const averageNetSalary =
      count > 0 ? Math.round((totalNetSalary / count) * 100) / 100 : 0;

    return {
      totalRecords: count,
      totalGrossSalary,
      totalAllowances,
      totalDeductions,
      totalNetSalary,
      averageGrossSalary,
      averageNetSalary,
      statusCounts,
      payPeriod: query.payPeriod ?? 'ALL',
    };
  }

  async getRecruitmentFunnelReport(user: AuthenticatedUser) {
    const organizationId = this.toObjectId(user.organizationId);

    const [openings, applications, interviews] = await Promise.all([
      this.jobOpeningModel
        .find({ organizationId })
        .select('status')
        .lean()
        .exec(),
      this.applicationModel
        .find({ organizationId })
        .select('status')
        .lean()
        .exec(),
      this.interviewModel
        .find({ organizationId })
        .select('status')
        .lean()
        .exec(),
    ]);

    const openingStatusCounts: Record<string, number> = {
      [JobOpeningStatus.DRAFT]: 0,
      [JobOpeningStatus.PUBLISHED]: 0,
      [JobOpeningStatus.CLOSED]: 0,
      [JobOpeningStatus.ARCHIVED]: 0,
    };

    for (const op of openings) {
      if (op.status && openingStatusCounts[op.status] !== undefined) {
        openingStatusCounts[op.status] += 1;
      }
    }

    const applicationStageCounts: Record<string, number> = {
      [ApplicationStatus.APPLIED]: 0,
      [ApplicationStatus.SCREENING]: 0,
      [ApplicationStatus.SHORTLISTED]: 0,
      [ApplicationStatus.INTERVIEW]: 0,
      [ApplicationStatus.OFFERED]: 0,
      [ApplicationStatus.HIRED]: 0,
      [ApplicationStatus.REJECTED]: 0,
    };

    for (const app of applications) {
      if (app.status && applicationStageCounts[app.status] !== undefined) {
        applicationStageCounts[app.status] += 1;
      }
    }

    const totalApplications = applications.length;
    const hiredCount =
      applicationStageCounts[ApplicationStatus.HIRED] ?? 0;
    const conversionRate =
      totalApplications > 0
        ? Math.round((hiredCount / totalApplications) * 10000) / 100
        : 0;

    const interviewStatusCounts: Record<string, number> = {
      [InterviewStatus.SCHEDULED]: 0,
      [InterviewStatus.CONFIRMED]: 0,
      [InterviewStatus.COMPLETED]: 0,
      [InterviewStatus.CANCELLED]: 0,
      [InterviewStatus.NO_SHOW]: 0,
      [InterviewStatus.RESCHEDULED]: 0,
    };

    for (const item of interviews) {
      if (item.status && interviewStatusCounts[item.status] !== undefined) {
        interviewStatusCounts[item.status] += 1;
      }
    }

    return {
      openings: {
        total: openings.length,
        statusCounts: openingStatusCounts,
      },
      applications: {
        total: totalApplications,
        hired: hiredCount,
        conversionRate,
        stageCounts: applicationStageCounts,
      },
      interviews: {
        total: interviews.length,
        statusCounts: interviewStatusCounts,
      },
    };
  }

  async getPerformanceGoalsReport(user: AuthenticatedUser) {
    const organizationId = this.toObjectId(user.organizationId);

    const [goals, reviews] = await Promise.all([
      this.goalModel
        .find({ organizationId })
        .select('status progress')
        .lean()
        .exec(),
      this.reviewModel
        .find({ organizationId })
        .select('status rating')
        .lean()
        .exec(),
    ]);

    const goalStatusCounts: Record<string, number> = {
      [GoalStatus.DRAFT]: 0,
      [GoalStatus.ACTIVE]: 0,
      [GoalStatus.COMPLETED]: 0,
      [GoalStatus.CANCELLED]: 0,
    };

    let totalProgress = 0;
    for (const goal of goals) {
      if (goal.status && goalStatusCounts[goal.status] !== undefined) {
        goalStatusCounts[goal.status] += 1;
      }
      totalProgress += goal.progress ?? 0;
    }

    const totalGoals = goals.length;
    const completedGoals = goalStatusCounts[GoalStatus.COMPLETED] ?? 0;
    const goalCompletionRate =
      totalGoals > 0
        ? Math.round((completedGoals / totalGoals) * 10000) / 100
        : 0;
    const averageProgress =
      totalGoals > 0
        ? Math.round((totalProgress / totalGoals) * 100) / 100
        : 0;

    const reviewStatusCounts: Record<string, number> = {
      [PerformanceReviewStatus.DRAFT]: 0,
      [PerformanceReviewStatus.SUBMITTED]: 0,
      [PerformanceReviewStatus.ACKNOWLEDGED]: 0,
      [PerformanceReviewStatus.COMPLETED]: 0,
    };

    let totalRating = 0;
    let ratedCount = 0;
    for (const rev of reviews) {
      if (rev.status && reviewStatusCounts[rev.status] !== undefined) {
        reviewStatusCounts[rev.status] += 1;
      }
      if (rev.rating !== undefined && rev.rating !== null) {
        totalRating += rev.rating;
        ratedCount += 1;
      }
    }

    const averageRating =
      ratedCount > 0
        ? Math.round((totalRating / ratedCount) * 100) / 100
        : 0;

    return {
      goals: {
        total: totalGoals,
        completionRate: goalCompletionRate,
        averageProgress,
        statusCounts: goalStatusCounts,
      },
      performanceReviews: {
        total: reviews.length,
        averageRating,
        statusCounts: reviewStatusCounts,
      },
    };
  }

  async getWorkforceIntelligence(user: AuthenticatedUser) {
    const [headcount, attendance, recruitment, performance] =
      await Promise.all([
        this.getHeadcountReport(user),
        this.getAttendanceLeaveReport(user, {}),
        this.getRecruitmentFunnelReport(user),
        this.getPerformanceGoalsReport(user),
      ]);

    // Workforce vitality score: weighted index (0 - 100)
    const vitalityScore = Math.min(
      100,
      Math.round(
        (attendance.attendance.attendanceRate * 0.4) +
          (performance.goals.completionRate * 0.3) +
          (performance.performanceReviews.averageRating > 0
            ? (performance.performanceReviews.averageRating / 5) * 100 * 0.3
            : 30),
      ),
    );

    return {
      vitalityScore,
      headcount: {
        total: headcount.totalEmployees,
        active: headcount.activeEmployees,
        newHiresLast30Days: headcount.newHiresLast30Days,
      },
      attendance: {
        attendanceRate: attendance.attendance.attendanceRate,
        totalRecords: attendance.attendance.totalRecords,
      },
      talentAcquisition: {
        openPositions: recruitment.openings.statusCounts[JobOpeningStatus.PUBLISHED] ?? 0,
        activeApplications: recruitment.applications.total,
        conversionRate: recruitment.applications.conversionRate,
      },
      execution: {
        goalCompletionRate: performance.goals.completionRate,
        averageRating: performance.performanceReviews.averageRating,
      },
    };
  }

  async exportReport(
    user: AuthenticatedUser,
    query: ReportExportQueryDto,
  ) {
    let data: unknown;

    switch (query.type) {
      case ReportExportType.HEADCOUNT:
        data = await this.getHeadcountReport(user);
        break;
      case ReportExportType.ATTENDANCE:
        data = await this.getAttendanceLeaveReport(user, {
          startDate: query.startDate,
          endDate: query.endDate,
        });
        break;
      case ReportExportType.PAYROLL:
        data = await this.getPayrollReport(user, {
          payPeriod: query.payPeriod,
        });
        break;
      case ReportExportType.RECRUITMENT:
        data = await this.getRecruitmentFunnelReport(user);
        break;
      case ReportExportType.PERFORMANCE:
        data = await this.getPerformanceGoalsReport(user);
        break;
      case ReportExportType.INTELLIGENCE:
        data = await this.getWorkforceIntelligence(user);
        break;
      default:
        throw new BadRequestException('Invalid export report type');
    }

    if (query.format === ReportExportFormat.CSV) {
      const csv = this.convertToCsv(data);
      return {
        contentType: 'text/csv',
        fileName: `${query.type}-report-${Date.now()}.csv`,
        content: csv,
      };
    }

    return {
      contentType: 'application/json',
      fileName: `${query.type}-report-${Date.now()}.json`,
      content: data,
    };
  }

  private convertToCsv(data: unknown): string {
    if (typeof data !== 'object' || data === null) {
      return String(data);
    }

    const flatRows: Record<string, string | number>[] = [];

    const flatten = (
      obj: Record<string, unknown>,
      prefix = '',
    ): Record<string, string | number> => {
      const res: Record<string, string | number> = {};
      for (const [k, v] of Object.entries(obj)) {
        const fullKey = prefix ? `${prefix}.${k}` : k;
        if (typeof v === 'object' && v !== null && !Array.isArray(v)) {
          Object.assign(
            res,
            flatten(v as Record<string, unknown>, fullKey),
          );
        } else {
          res[fullKey] = typeof v === 'number' ? v : String(v);
        }
      }
      return res;
    };

    flatRows.push(flatten(data as Record<string, unknown>));

    const headers = Object.keys(flatRows[0] ?? {});
    const headerRow = headers.join(',');
    const valuesRow = headers
      .map((h) => JSON.stringify(flatRows[0]?.[h] ?? ''))
      .join(',');

    return `${headerRow}\n${valuesRow}`;
  }

  private toObjectId(value: string | Types.ObjectId): Types.ObjectId {
    if (value instanceof Types.ObjectId) {
      return value;
    }

    if (!Types.ObjectId.isValid(value)) {
      throw new BadRequestException('Invalid ID');
    }

    return new Types.ObjectId(value);
  }
}
