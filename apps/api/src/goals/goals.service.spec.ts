
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { GoalStatus } from './schemas/goal.schema.js';
import { GoalsService } from './goals.service.js';

describe('GoalsService', () => {
  let service: GoalsService;

  const goalModel = {
    create: vi.fn(),
    find: vi.fn(),
    findOne: vi.fn(),
    findOneAndUpdate: vi.fn(),
    countDocuments: vi.fn(),
  };

  const employeeModel = {
    findOne: vi.fn(),
  };

  const auditLogsService = {
    record: vi.fn(),
  };

  const user = {
    userId: '507f1f77bcf86cd799439011',
    organizationId: '507f1f77bcf86cd799439012',
    role: 'HR_ADMIN',
    permissions: [],
  } as any;

  const employee = {
    _id: '507f1f77bcf86cd799439013',
    organizationId: user.organizationId,
    userId: '507f1f77bcf86cd799439014',
    employeeCode: 'EMP100',
    firstName: 'Test',
    lastName: 'Employee',
    status: 'ACTIVE',
  };

  const goal = {
    _id: '507f1f77bcf86cd799439015',
    organizationId: user.organizationId,
    employeeId: employee._id,
    createdBy: user.userId,
    title: 'Improve backend quality',
    priority: 'HIGH',
    status: GoalStatus.DRAFT,
    progress: 0,
    startDate: new Date('2026-10-01'),
    dueDate: new Date('2026-12-31'),
  };

  beforeEach(() => {
    vi.clearAllMocks();

    service = new GoalsService(
      goalModel as any,
      employeeModel as any,
      auditLogsService as any,
    );
  });

  describe('create', () => {
    it('creates a draft goal for an employee in the same organization', async () => {
      employeeModel.findOne.mockResolvedValue(employee);
      goalModel.create.mockResolvedValue(goal);
      auditLogsService.record.mockResolvedValue(undefined);

      const result = await service.create(
        employee._id.toString(),
        {
          title: 'Improve backend quality',
          priority: 'HIGH',
          startDate: '2026-10-01',
          dueDate: '2026-12-31',
        } as any,
        user,
      );

      expect(goalModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          organizationId: expect.anything(),
          employeeId: expect.anything(),
          createdBy: expect.anything(),
          title: 'Improve backend quality',
          status: GoalStatus.DRAFT,
          progress: 0,
        }),
      );

      expect(result).toEqual(goal);
      expect(auditLogsService.record).toHaveBeenCalled();
    });

    it('rejects a goal when dueDate is before startDate', async () => {
      await expect(
        service.create(
          employee._id.toString(),
          {
            title: 'Invalid goal',
            priority: 'MEDIUM',
            startDate: '2026-12-31',
            dueDate: '2026-10-01',
          } as any,
          user,
        ),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(employeeModel.findOne).not.toHaveBeenCalled();
      expect(goalModel.create).not.toHaveBeenCalled();
    });

    it('rejects creation when the employee does not belong to the organization', async () => {
      employeeModel.findOne.mockResolvedValue(null);

      await expect(
        service.create(
          employee._id.toString(),
          {
            title: 'Organization isolation',
            priority: 'MEDIUM',
            startDate: '2026-10-01',
            dueDate: '2026-12-31',
          } as any,
          user,
        ),
      ).rejects.toBeInstanceOf(NotFoundException);

      expect(goalModel.create).not.toHaveBeenCalled();
    });
  });

  describe('activate', () => {
    it('activates a draft goal', async () => {
      const draftGoal = {
        ...goal,
        status: GoalStatus.DRAFT,
        save: vi.fn(),
      };

      const updatedGoal = {
        ...draftGoal,
        status: GoalStatus.ACTIVE,
      };

      draftGoal.save.mockResolvedValue(updatedGoal);

      goalModel.findOne.mockResolvedValue(draftGoal);
      auditLogsService.record.mockResolvedValue(undefined);

      const result = await service.activate(
        goal._id.toString(),
        user,
      );

      expect(draftGoal.save).toHaveBeenCalled();
      expect(result.status).toBe(GoalStatus.ACTIVE);
      expect(auditLogsService.record).toHaveBeenCalled();
    });

    it('rejects activation of a non-draft goal', async () => {
      goalModel.findOne.mockResolvedValue({
        ...goal,
        status: GoalStatus.COMPLETED,
      });

      await expect(
        service.activate(goal._id.toString(), user),
      ).rejects.toBeInstanceOf(ConflictException);

      expect(goalModel.findOneAndUpdate).not.toHaveBeenCalled();
    });
  });

  describe('complete', () => {
    it('completes an active goal and sets progress to 100', async () => {
      const activeGoal = {
        ...goal,
        status: GoalStatus.ACTIVE,
        progress: 75,
        save: vi.fn(),
      };

      const completedGoal = {
        ...activeGoal,
        status: GoalStatus.COMPLETED,
        progress: 100,
        completedBy: user.userId,
        completedAt: new Date(),
      };

      activeGoal.save.mockResolvedValue(completedGoal);

      goalModel.findOne.mockResolvedValue(activeGoal);
      auditLogsService.record.mockResolvedValue(undefined);

      const result = await service.complete(
        goal._id.toString(),
        user,
      );

      expect(activeGoal.save).toHaveBeenCalled();
      expect(result.status).toBe(GoalStatus.COMPLETED);
      expect(result.progress).toBe(100);
      expect(auditLogsService.record).toHaveBeenCalled();
    });

    it('rejects completion of a draft goal', async () => {
      goalModel.findOne.mockResolvedValue({
        ...goal,
        status: GoalStatus.DRAFT,
      });

      await expect(
        service.complete(goal._id.toString(), user),
      ).rejects.toBeInstanceOf(ConflictException);

      expect(goalModel.findOneAndUpdate).not.toHaveBeenCalled();
    });
  });

  describe('cancel', () => {
    it('cancels a draft goal', async () => {
      const draftGoal = {
        ...goal,
        status: GoalStatus.DRAFT,
        save: vi.fn(),
      };

      const cancelledGoal = {
        ...draftGoal,
        status: GoalStatus.CANCELLED,
      };

      draftGoal.save.mockResolvedValue(cancelledGoal);

      goalModel.findOne.mockResolvedValue(draftGoal);
      auditLogsService.record.mockResolvedValue(undefined);

      const result = await service.cancel(
        goal._id.toString(),
        user,
      );

      expect(draftGoal.save).toHaveBeenCalled();
      expect(result.status).toBe(GoalStatus.CANCELLED);
      expect(auditLogsService.record).toHaveBeenCalled();
    });

    it('rejects cancellation of a completed goal', async () => {
      goalModel.findOne.mockResolvedValue({
        ...goal,
        status: GoalStatus.COMPLETED,
      });

      await expect(
        service.cancel(goal._id.toString(), user),
      ).rejects.toBeInstanceOf(ConflictException);

      expect(goalModel.findOneAndUpdate).not.toHaveBeenCalled();
    });
  });
});
