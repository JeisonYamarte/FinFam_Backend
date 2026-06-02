import { BadRequestException } from '@nestjs/common';
import { ExpensesService } from './expenses.service';

describe('ExpensesService', () => {
  let service: ExpensesService;
  let prismaMock: {
    memberships: { findUnique: jest.Mock; findMany: jest.Mock };
    households: { findUnique: jest.Mock };
    expenses: { create: jest.Mock };
    expensePayers: { createMany: jest.Mock };
    expenseSplits: { createMany: jest.Mock };
    $transaction: jest.Mock;
  };

  beforeEach(() => {
    prismaMock = {
      memberships: {
        findUnique: jest.fn().mockResolvedValue({
          role: 'ADMIN',
          isActive: true,
        }),
        findMany: jest
          .fn()
          .mockResolvedValue([{ userId: 'u1' }, { userId: 'u2' }]),
      },
      households: {
        findUnique: jest.fn().mockResolvedValue({ id: 'h1' }),
      },
      expenses: {
        create: jest.fn().mockResolvedValue({ id: 'e1' }),
      },
      expensePayers: {
        createMany: jest.fn().mockResolvedValue({ count: 2 }),
      },
      expenseSplits: {
        createMany: jest.fn().mockResolvedValue({ count: 2 }),
      },
      $transaction: jest
        .fn()
        .mockImplementation(
          (cb: (tx: typeof prismaMock) => Promise<{ id: string }>) =>
            cb(prismaMock),
        ),
    };

    const cloudinaryMock = {
      uploadFile: jest.fn(),
      deleteFile: jest.fn(),
    };

    service = new ExpensesService(prismaMock as never, cloudinaryMock as never);
  });

  describe('create (financial integrity critical path)', () => {
    const baseDto = {
      householdId: 'h1',
      title: 'Groceries',
      description: 'weekly market',
      amount: 100,
      date: '2026-05-20T00:00:00.000Z',
      payers: [
        { userId: 'u1', amountPaid: 40 },
        { userId: 'u2', amountPaid: 60 },
      ],
      splits: [
        { userId: 'u1', amount: 50 },
        { userId: 'u2', amount: 50 },
      ],
    };

    it('accepts valid totals and creates expense', async () => {
      await expect(service.create('u1', baseDto)).resolves.toEqual({
        id: 'e1',
      });
      expect(prismaMock.expenses.create).toHaveBeenCalled();
    });

    it('accepts floating point totals when cents still match', async () => {
      await expect(
        service.create('u1', {
          ...baseDto,
          amount: 0.3,
          payers: [
            { userId: 'u1', amountPaid: 0.1 },
            { userId: 'u2', amountPaid: 0.2 },
          ],
          splits: [
            { userId: 'u1', amount: 0.15 },
            { userId: 'u2', amount: 0.15 },
          ],
        }),
      ).resolves.toEqual({ id: 'e1' });
    });

    it('throws when payers total differs from amount', async () => {
      await expect(
        service.create('u1', {
          ...baseDto,
          payers: [
            { userId: 'u1', amountPaid: 30 },
            { userId: 'u2', amountPaid: 60 },
          ],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws when splits total differs from amount', async () => {
      await expect(
        service.create('u1', {
          ...baseDto,
          splits: [
            { userId: 'u1', amount: 40 },
            { userId: 'u2', amount: 40 },
          ],
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
