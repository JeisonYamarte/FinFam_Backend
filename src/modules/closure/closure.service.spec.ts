import { BadRequestException } from '@nestjs/common';
import { ClosureService } from './closure.service';

describe('ClosureService', () => {
  const makeService = () => {
    const prismaMock = {
      households: { findUnique: jest.fn() },
      memberships: { findUnique: jest.fn() },
      expenses: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        updateMany: jest.fn(),
      },
      closures: { findUnique: jest.fn() },
      closureBalance: { createMany: jest.fn(), findMany: jest.fn() },
      $transaction: jest.fn(),
    };

    const txMock = {
      closures: { create: jest.fn() },
      closureBalance: { createMany: jest.fn() },
      expenses: { updateMany: jest.fn() },
    };

    const closureBalancesServiceMock = {
      calculate: jest.fn(),
      calculateSettlement: jest.fn(),
      toCreateManyData: jest.fn(),
    };

    const service = new ClosureService(
      prismaMock as never,
      closureBalancesServiceMock as never,
    );

    return { service, prismaMock, txMock, closureBalancesServiceMock };
  };

  it('throws when there are no open expenses to close', async () => {
    const { service, prismaMock } = makeService();

    prismaMock.households.findUnique.mockResolvedValue({ id: 'h1' });
    prismaMock.memberships.findUnique.mockResolvedValue({
      role: 'ADMIN',
      isActive: true,
    });
    prismaMock.expenses.findFirst.mockResolvedValue(null);

    await expect(service.create('u1', { householdId: 'h1' })).rejects.toThrow(
      BadRequestException,
    );
  });

  it('creates a closure transaction and links open expenses', async () => {
    const { service, prismaMock, txMock, closureBalancesServiceMock } =
      makeService();

    const openStartDate = new Date('2026-05-01T10:00:00.000Z');

    prismaMock.households.findUnique.mockResolvedValue({ id: 'h1' });
    prismaMock.memberships.findUnique.mockResolvedValue({
      role: 'ADMIN',
      isActive: true,
    });
    prismaMock.expenses.findFirst.mockResolvedValue({ date: openStartDate });
    prismaMock.expenses.findMany.mockResolvedValue([
      {
        id: 'e1',
        amount: 120,
        payers: [{ userId: 'u1', amountPaid: 120 }],
        splits: [
          { userId: 'u1', amount: 60 },
          { userId: 'u2', amount: 60 },
        ],
      },
    ]);

    closureBalancesServiceMock.calculate.mockReturnValue([
      {
        fromUserId: 'u2',
        toUserId: 'u1',
        amount: 60,
      },
    ]);

    closureBalancesServiceMock.toCreateManyData.mockReturnValue([
      {
        closureId: 'c1',
        fromUserId: 'u2',
        toUserId: 'u1',
        amount: 60,
      },
    ]);

    txMock.closures.create.mockResolvedValue({ id: 'c1' });
    txMock.closureBalance.createMany.mockResolvedValue({ count: 1 });
    txMock.expenses.updateMany.mockResolvedValue({ count: 1 });

    prismaMock.$transaction.mockImplementation(
      (
        cb: (tx: {
          closures: { create: jest.Mock };
          closureBalance: { createMany: jest.Mock };
          expenses: { updateMany: jest.Mock };
        }) => Promise<{ id: string }>,
      ) => cb(txMock),
    );

    const result = await service.create('u1', { householdId: 'h1' });

    expect(result).toEqual({
      closureId: 'c1',
      balances: [{ fromUserId: 'u2', toUserId: 'u1', amount: 60 }],
    });

    expect(txMock.closures.create).toHaveBeenCalledTimes(1);

    expect(txMock.closureBalance.createMany).toHaveBeenCalledWith({
      data: [
        {
          closureId: 'c1',
          fromUserId: 'u2',
          toUserId: 'u1',
          amount: 60,
        },
      ],
    });

    expect(txMock.expenses.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ['e1'] } },
      data: { closureId: 'c1' },
    });
  });
});
