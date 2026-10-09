import { BadRequestException } from '@nestjs/common';
import { Types } from 'mongoose';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AttendanceStatus } from '../attendance/schemas/attendance.schema.js';
import { GoalStatus } from '../goals/schemas/goal.schema.js';
import { LeaveRequestStatus } from '../leave-requests/schemas/leave-request.schema.js';
import { PayrollStatus } from '../payroll/schemas/payroll-record.schema.js';
import { PerformanceReviewStatus } from '../performance/schemas/performance-review.schema.js';
import { ApplicationStatus } from '../recruitment/applications/schemas/application.schema.js';
import { InterviewStatus } from '../recruitment/interviews/schemas/interview.schema.js';
import { JobOpeningStatus } from '../recruitment/schemas/job-opening.schema.js';

import {
  ReportExportFormat,
  ReportExportType,
} from './dto/reports-query.dto.js';
import { ReportsService } from './reports.service.js';

describe('ReportsService', () => {
  let service: ReportsService;

  const organizationId = '6aa522bc5145273578dcdc72';
  const userId = '6aa522bc5145273578dcdc73';
  const departmentId = '6ac510000000000000000060';

  const user = {
    userId,
    organizationId,
  };

  const employeeModel = {
    countDocuments: vi.fn(),
    find: vi.fn(),
  };

  const attendanceModel = {
    find: vi.fn(),
  };

  const leaveRequestModel = {
    find: vi.fn(),
  };

  const payrollModel = {
    find: vi.fn(),
  };

  const jobOpeningModel = {
    find: vi.fn(),
  };

  const applicationModel = {
    find: vi.fn(),
  };

  const interviewModel = {
    find: vi.fn(),
  };

  const goalModel = {
    find: vi.fn(),
  };

  const reviewModel = {
    find: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();

    service = new ReportsService(
      employeeModel as never,
      attendanceModel as never,
      leaveRequestModel as never,
      payrollModel as never,
      jobOpeningModel as never,
      applicationModel as never,
      interviewModel as never,
      goalModel as never,
      reviewModel as never,
    );
  });

  const mockQuery = (result: unknown) => ({
    select: vi.fn().mockReturnThis(),
    lean: vi.fn().mockReturnThis(),
    exec: vi.fn().mockResolvedValue(result),
  });

  describe('getHeadcountReport', () => {
    it('aggregates headcount and demographic metrics with tenant isolation', async () => {
      employeeModel.countDocuments
        .mockReturnValueOnce({ exec: vi.fn().mockResolvedValue(10) })
        .mockReturnValueOnce({ exec: vi.fn().mockResolvedValue(8) });

      const employees = [
        {
          employmentStatus: 'ACTIVE',
          employmentType: 'FULL_TIME',
          workMode: 'REMOTE',
          departmentId: new Types.ObjectId(departmentId),
          joiningDate: new Date(),
        },
        {
          employmentStatus: 'INACTIVE',
          employmentType: 'CONTRACT',
          workMode: 'ONSITE',
          departmentId: new Types.ObjectId(departmentId),
          joiningDate: new Date('2025-01-01'),
        },
      ];

      employeeModel.find.mockReturnValue(mockQuery(employees));

      const result = await service.getHeadcountReport(user);

      expect(result.totalEmployees).toBe(10);
      expect(result.activeEmployees).toBe(8);
      expect(result.inactiveEmployees).toBe(2);
      expect(result.newHiresLast30Days).toBe(1);
      expect(result.byStatus['ACTIVE']).toBe(1);
      expect(result.byStatus['INACTIVE']).toBe(1);
      expect(result.byEmploymentType['FULL_TIME']).toBe(1);
      expect(result.byWorkMode['REMOTE']).toBe(1);
      expect(result.byDepartment[departmentId]).toBe(2);
    });
  });

  describe('getAttendanceLeaveReport', () => {
    it('calculates attendance rate and aggregates leave status counts', async () => {
      const attendance = [
        { status: AttendanceStatus.PRESENT },
        { status: AttendanceStatus.PRESENT },
        { status: AttendanceStatus.LATE },
        { status: AttendanceStatus.ABSENT },
      ];

      const leave = [
        { status: LeaveRequestStatus.APPROVED },
        { status: LeaveRequestStatus.PENDING },
      ];

      attendanceModel.find.mockReturnValue(mockQuery(attendance));
      leaveRequestModel.find.mockReturnValue(mockQuery(leave));

      const result = await service.getAttendanceLeaveReport(user, {
        startDate: '2026-10-01',
        endDate: '2026-10-31',
      });

      expect(result.attendance.totalRecords).toBe(4);
      expect(result.attendance.attendanceRate).toBe(75); // 3 present/late out of 4 = 75%
      expect(result.attendance.counts[AttendanceStatus.PRESENT]).toBe(2);
      expect(result.attendance.counts[AttendanceStatus.LATE]).toBe(1);
      expect(result.attendance.counts[AttendanceStatus.ABSENT]).toBe(1);

      expect(result.leave.totalRequests).toBe(2);
      expect(result.leave.statusCounts[LeaveRequestStatus.APPROVED]).toBe(1);
      expect(result.leave.statusCounts[LeaveRequestStatus.PENDING]).toBe(1);
    });
  });

  describe('getPayrollReport', () => {
    it('aggregates compensation totals and averages without exposing individual salaries', async () => {
      const records = [
        {
          status: PayrollStatus.PAID,
          basicSalary: 100000,
          allowances: 20000,
          deductions: 10000,
          netSalary: 110000,
          payPeriod: '2026-10',
        },
        {
          status: PayrollStatus.APPROVED,
          basicSalary: 80000,
          allowances: 10000,
          deductions: 5000,
          netSalary: 85000,
          payPeriod: '2026-10',
        },
      ];

      payrollModel.find.mockReturnValue(mockQuery(records));

      const result = await service.getPayrollReport(user, {
        payPeriod: '2026-10',
      });

      expect(result.totalRecords).toBe(2);
      expect(result.totalGrossSalary).toBe(180000);
      expect(result.totalAllowances).toBe(30000);
      expect(result.totalDeductions).toBe(15000);
      expect(result.totalNetSalary).toBe(195000);
      expect(result.averageGrossSalary).toBe(90000);
      expect(result.averageNetSalary).toBe(97500);
      expect(result.statusCounts[PayrollStatus.PAID]).toBe(1);
      expect(result.statusCounts[PayrollStatus.APPROVED]).toBe(1);
    });
  });

  describe('getRecruitmentFunnelReport', () => {
    it('calculates recruitment pipeline metrics and conversion rate', async () => {
      jobOpeningModel.find.mockReturnValue(
        mockQuery([
          { status: JobOpeningStatus.PUBLISHED },
          { status: JobOpeningStatus.DRAFT },
        ]),
      );

      applicationModel.find.mockReturnValue(
        mockQuery([
          { status: ApplicationStatus.APPLIED },
          { status: ApplicationStatus.INTERVIEW },
          { status: ApplicationStatus.HIRED },
          { status: ApplicationStatus.REJECTED },
        ]),
      );

      interviewModel.find.mockReturnValue(
        mockQuery([
          { status: InterviewStatus.SCHEDULED },
          { status: InterviewStatus.COMPLETED },
        ]),
      );

      const result = await service.getRecruitmentFunnelReport(user);

      expect(result.openings.total).toBe(2);
      expect(result.openings.statusCounts[JobOpeningStatus.PUBLISHED]).toBe(1);
      expect(result.applications.total).toBe(4);
      expect(result.applications.hired).toBe(1);
      expect(result.applications.conversionRate).toBe(25); // 1 / 4 = 25%
      expect(result.interviews.total).toBe(2);
      expect(result.interviews.statusCounts[InterviewStatus.COMPLETED]).toBe(1);
    });
  });

  describe('getPerformanceGoalsReport', () => {
    it('aggregates goal completion and performance ratings', async () => {
      goalModel.find.mockReturnValue(
        mockQuery([
          { status: GoalStatus.COMPLETED, progress: 100 },
          { status: GoalStatus.ACTIVE, progress: 50 },
        ]),
      );

      reviewModel.find.mockReturnValue(
        mockQuery([
          { status: PerformanceReviewStatus.COMPLETED, rating: 5 },
          { status: PerformanceReviewStatus.COMPLETED, rating: 3 },
        ]),
      );

      const result = await service.getPerformanceGoalsReport(user);

      expect(result.goals.total).toBe(2);
      expect(result.goals.completionRate).toBe(50);
      expect(result.goals.averageProgress).toBe(75);
      expect(result.performanceReviews.total).toBe(2);
      expect(result.performanceReviews.averageRating).toBe(4);
    });
  });

  describe('getWorkforceIntelligence', () => {
    it('computes composite workforce vitality score and pulse summary', async () => {
      employeeModel.countDocuments
        .mockReturnValueOnce({ exec: vi.fn().mockResolvedValue(10) })
        .mockReturnValueOnce({ exec: vi.fn().mockResolvedValue(9) });
      employeeModel.find.mockReturnValue(mockQuery([]));

      attendanceModel.find.mockReturnValue(
        mockQuery([{ status: AttendanceStatus.PRESENT }]),
      );
      leaveRequestModel.find.mockReturnValue(mockQuery([]));

      jobOpeningModel.find.mockReturnValue(
        mockQuery([{ status: JobOpeningStatus.PUBLISHED }]),
      );
      applicationModel.find.mockReturnValue(
        mockQuery([
          { status: ApplicationStatus.APPLIED },
          { status: ApplicationStatus.HIRED },
        ]),
      );
      interviewModel.find.mockReturnValue(mockQuery([]));

      goalModel.find.mockReturnValue(
        mockQuery([{ status: GoalStatus.COMPLETED, progress: 100 }]),
      );
      reviewModel.find.mockReturnValue(
        mockQuery([{ status: PerformanceReviewStatus.COMPLETED, rating: 5 }]),
      );

      const result = await service.getWorkforceIntelligence(user);

      expect(result.vitalityScore).toBeGreaterThan(0);
      expect(result.vitalityScore).toBeLessThanOrEqual(100);
      expect(result.headcount.total).toBe(10);
      expect(result.attendance.attendanceRate).toBe(100);
      expect(result.talentAcquisition.openPositions).toBe(1);
      expect(result.talentAcquisition.conversionRate).toBe(50);
      expect(result.execution.goalCompletionRate).toBe(100);
      expect(result.execution.averageRating).toBe(5);
    });
  });

  describe('exportReport', () => {
    it('exports report in JSON format', async () => {
      employeeModel.countDocuments
        .mockReturnValueOnce({ exec: vi.fn().mockResolvedValue(5) })
        .mockReturnValueOnce({ exec: vi.fn().mockResolvedValue(5) });
      employeeModel.find.mockReturnValue(mockQuery([]));

      const result = await service.exportReport(user, {
        type: ReportExportType.HEADCOUNT,
        format: ReportExportFormat.JSON,
      });

      expect(result.contentType).toBe('application/json');
      expect(result.fileName).toContain('headcount-report-');
      expect(result.content).toBeDefined();
    });

    it('exports report in CSV format', async () => {
      employeeModel.countDocuments
        .mockReturnValueOnce({ exec: vi.fn().mockResolvedValue(5) })
        .mockReturnValueOnce({ exec: vi.fn().mockResolvedValue(5) });
      employeeModel.find.mockReturnValue(mockQuery([]));

      const result = await service.exportReport(user, {
        type: ReportExportType.HEADCOUNT,
        format: ReportExportFormat.CSV,
      });

      expect(result.contentType).toBe('text/csv');
      expect(result.fileName).toContain('headcount-report-');
      expect(typeof result.content).toBe('string');
      expect((result.content as string).split('\n')).toHaveLength(2);
    });

    it('rejects invalid export type', async () => {
      await expect(
        service.exportReport(user, {
          type: 'invalid-type' as ReportExportType,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
