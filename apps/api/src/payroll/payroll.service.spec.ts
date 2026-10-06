
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { ConflictException, NotFoundException } from '@nestjs/common';

import { PayrollService } from './payroll.service.js';
import {
  PayrollStatus,
} from './schemas/payroll-record.schema.js';
import {
  AuditAction,
  AuditEntity,
} from '../audit-logs/schemas/audit-log.schema.js';

describe('PayrollService', () => {
  let service: PayrollService;

  const payrollModel = {
    findOne: vi.fn(),
    find: vi.fn(),
    countDocuments: vi.fn(),
    create: vi.fn(),
  };

  const employeeModel = {
    findOne: vi.fn(),
  };

  const auditLogsService = {
    record: vi.fn(),
  };

  const user = {
    userId: '6aa522bc5145273578dcdc73',
    organizationId: '6aa522bc5145273578dcdc72',
  } as any;

  const payrollId = '6ac4d24c1c6c9f848545c2e5';

  beforeEach(() => {
    vi.clearAllMocks();

    service = new PayrollService(
      payrollModel as any,
      employeeModel as any,
      auditLogsService as any,
    );
  });

  function mockRecord(status: PayrollStatus) {
    const record: any = {
      _id: payrollId,
      organizationId: user.organizationId,
      employeeId: '6abf3bf5891cc9e977636a6f',
      payPeriod: '2026-11',
      status,
      basicSalary: 50000,
      allowances: 10000,
      deductions: 5000,
      grossSalary: 60000,
      netSalary: 55000,
      notes: undefined,
      save: vi.fn(),
    };

    record.save.mockResolvedValue(record);

    return record;
  }

  describe('process', () => {
    it('should transition DRAFT to PROCESSED and create an audit log', async () => {
      const record = mockRecord(PayrollStatus.DRAFT);

      payrollModel.findOne.mockResolvedValue(record);

      const result = await service.process(
        payrollId,
        user,
        'Process payroll',
      );

      expect(result.status).toBe(PayrollStatus.PROCESSED);
      expect(result.processedBy!.toString()).toBe(user.userId);
      expect(result.processedAt).toBeInstanceOf(Date);
      expect(record.save).toHaveBeenCalledOnce();

      expect(auditLogsService.record).toHaveBeenCalledWith(
        expect.objectContaining({
          user,
          action: AuditAction.UPDATE,
          entity: AuditEntity.PAYROLL,
          entityId: record._id,
          metadata: expect.objectContaining({
            previousStatus: PayrollStatus.DRAFT,
            newStatus: PayrollStatus.PROCESSED,
            notes: 'Process payroll',
          }),
        }),
      );
    });

    it('should reject processing an already processed payroll', async () => {
      const record = mockRecord(PayrollStatus.PROCESSED);

      payrollModel.findOne.mockResolvedValue(record);

      await expect(
        service.process(payrollId, user),
      ).rejects.toBeInstanceOf(ConflictException);

      expect(record.save).not.toHaveBeenCalled();
      expect(auditLogsService.record).not.toHaveBeenCalled();
    });
  });

  describe('approve', () => {
    it('should transition PROCESSED to APPROVED and create an audit log', async () => {
      const record = mockRecord(PayrollStatus.PROCESSED);

      payrollModel.findOne.mockResolvedValue(record);

      const result = await service.approve(
        payrollId,
        user,
        'Approve payroll',
      );

      expect(result.status).toBe(PayrollStatus.APPROVED);
      expect(result.approvedBy!.toString()).toBe(user.userId);
      expect(result.approvedAt).toBeInstanceOf(Date);
      expect(record.save).toHaveBeenCalledOnce();

      expect(auditLogsService.record).toHaveBeenCalledWith(
        expect.objectContaining({
          user,
          action: AuditAction.APPROVE,
          entity: AuditEntity.PAYROLL,
          entityId: record._id,
          metadata: expect.objectContaining({
            previousStatus: PayrollStatus.PROCESSED,
            newStatus: PayrollStatus.APPROVED,
            notes: 'Approve payroll',
          }),
        }),
      );
    });

    it('should reject approval of a DRAFT payroll', async () => {
      const record = mockRecord(PayrollStatus.DRAFT);

      payrollModel.findOne.mockResolvedValue(record);

      await expect(
        service.approve(payrollId, user),
      ).rejects.toBeInstanceOf(ConflictException);

      expect(record.save).not.toHaveBeenCalled();
      expect(auditLogsService.record).not.toHaveBeenCalled();
    });
  });

  describe('markPaid', () => {
    it('should transition APPROVED to PAID and create an audit log', async () => {
      const record = mockRecord(PayrollStatus.APPROVED);

      payrollModel.findOne.mockResolvedValue(record);

      const result = await service.markPaid(
        payrollId,
        user,
        'Pay payroll',
      );

      expect(result.status).toBe(PayrollStatus.PAID);
      expect(result.paidBy!.toString()).toBe(user.userId);
      expect(result.paidAt).toBeInstanceOf(Date);
      expect(record.save).toHaveBeenCalledOnce();

      expect(auditLogsService.record).toHaveBeenCalledWith(
        expect.objectContaining({
          user,
          action: AuditAction.UPDATE,
          entity: AuditEntity.PAYROLL,
          entityId: record._id,
          metadata: expect.objectContaining({
            previousStatus: PayrollStatus.APPROVED,
            newStatus: PayrollStatus.PAID,
            notes: 'Pay payroll',
          }),
        }),
      );
    });

    it('should reject payment before approval', async () => {
      const record = mockRecord(PayrollStatus.PROCESSED);

      payrollModel.findOne.mockResolvedValue(record);

      await expect(
        service.markPaid(payrollId, user),
      ).rejects.toBeInstanceOf(ConflictException);

      expect(record.save).not.toHaveBeenCalled();
      expect(auditLogsService.record).not.toHaveBeenCalled();
    });
  });

  describe('cancel', () => {
    it('should transition DRAFT to CANCELLED and create an audit log', async () => {
      const record = mockRecord(PayrollStatus.DRAFT);

      payrollModel.findOne.mockResolvedValue(record);

      const result = await service.cancel(
        payrollId,
        user,
        'Cancel payroll',
      );

      expect(result.status).toBe(PayrollStatus.CANCELLED);
      expect(record.save).toHaveBeenCalledOnce();

      expect(auditLogsService.record).toHaveBeenCalledWith(
        expect.objectContaining({
          user,
          action: AuditAction.CANCEL,
          entity: AuditEntity.PAYROLL,
          entityId: record._id,
          metadata: expect.objectContaining({
            previousStatus: PayrollStatus.DRAFT,
            newStatus: PayrollStatus.CANCELLED,
            notes: 'Cancel payroll',
          }),
        }),
      );
    });

    it('should reject cancellation of a PAID payroll', async () => {
      const record = mockRecord(PayrollStatus.PAID);

      payrollModel.findOne.mockResolvedValue(record);

      await expect(
        service.cancel(payrollId, user),
      ).rejects.toBeInstanceOf(ConflictException);

      expect(record.save).not.toHaveBeenCalled();
      expect(auditLogsService.record).not.toHaveBeenCalled();
    });
  });

  describe('not found handling', () => {
    it('should throw NotFoundException when payroll does not exist', async () => {
      payrollModel.findOne.mockResolvedValue(null);

      await expect(
        service.process(payrollId, user),
      ).rejects.toBeInstanceOf(NotFoundException);

      expect(auditLogsService.record).not.toHaveBeenCalled();
    });
  });
});

