import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role } from 'src/generated/prisma/client';
import type { ExpenseInput } from 'src/modules/balance-engine/balance-engine.interfaces';
import { PrismaService } from 'src/modules/prisma/prisma.service';
import { CreateClosureDto } from './dto/create-closure.dto';
import { ListClosuresQueryDto } from './dto/list-closures-query.dto';
import { ClosureBalancesService } from './closure-balances.service';

@Injectable()
export class ClosureService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly closureBalancesService: ClosureBalancesService,
  ) {}

  private async getOpenExpensesPeriod(householdId: string) {
    const firstOpenExpense = await this.prisma.expenses.findFirst({
      where: {
        householdId,
        closureId: null,
      },
      orderBy: { date: 'asc' },
      select: { date: true },
    });

    if (!firstOpenExpense) {
      throw new BadRequestException(
        'No open expenses available for closure in this period',
      );
    }

    return {
      startDate: firstOpenExpense.date,
      endDate: new Date(),
    };
  }

  private async assertHouseholdExists(householdId: string): Promise<void> {
    const household = await this.prisma.households.findUnique({
      where: { id: householdId },
      select: { id: true },
    });

    if (!household) {
      throw new NotFoundException('Household not found');
    }
  }

  private async validateMembership(userId: string, householdId: string) {
    await this.assertHouseholdExists(householdId);

    const membership = await this.prisma.memberships.findUnique({
      where: { userId_householdId: { userId, householdId } },
    });

    if (!membership || !membership.isActive) {
      throw new ForbiddenException('You are not a member of this household');
    }

    return membership;
  }

  private async validateAdminMembership(userId: string, householdId: string) {
    const membership = await this.validateMembership(userId, householdId);

    if (membership.role !== Role.ADMIN) {
      throw new ForbiddenException('Only admins can perform this action');
    }

    return membership;
  }

  private async getClosureOrThrow(closureId: string) {
    const closure = await this.prisma.closures.findUnique({
      where: { id: closureId },
      select: {
        id: true,
        householdId: true,
        startDate: true,
        endDate: true,
        createdAt: true,
      },
    });

    if (!closure) {
      throw new NotFoundException('Closure not found');
    }

    return closure;
  }

  private toExpenseInput(
    expenses: Array<{
      id: string;
      amount: { toString(): string } | number;
      payers: Array<{
        userId: string;
        amountPaid: { toString(): string } | number;
      }>;
      splits: Array<{
        userId: string;
        amount: { toString(): string } | number;
      }>;
    }>,
  ): ExpenseInput[] {
    return expenses.map((expense) => ({
      id: expense.id,
      amount: Number(expense.amount),
      payers: expense.payers.map((payer) => ({
        userId: payer.userId,
        amountPaid: Number(payer.amountPaid),
      })),
      splits: expense.splits.map((split) => ({
        userId: split.userId,
        amount: Number(split.amount),
      })),
    }));
  }

  async create(userId: string, dto: CreateClosureDto) {
    await this.validateAdminMembership(userId, dto.householdId);

    const { startDate, endDate } = await this.getOpenExpensesPeriod(
      dto.householdId,
    );

    const expenses = await this.prisma.expenses.findMany({
      where: {
        householdId: dto.householdId,
        closureId: null,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { date: 'asc' },
      select: {
        id: true,
        amount: true,
        payers: {
          select: { userId: true, amountPaid: true },
        },
        splits: {
          select: { userId: true, amount: true },
        },
      },
    });

    if (expenses.length === 0) {
      throw new BadRequestException(
        'No open expenses available for closure in this period',
      );
    }

    const balances = this.closureBalancesService.calculate(
      this.toExpenseInput(expenses),
    );

    const result = await this.prisma.$transaction(async (tx) => {
      const closure = await tx.closures.create({
        data: {
          householdId: dto.householdId,
          startDate,
          endDate,
        },
      });

      if (balances.length > 0) {
        await tx.closureBalance.createMany({
          data: this.closureBalancesService.toCreateManyData(
            closure.id,
            balances,
          ),
        });
      }

      await tx.expenses.updateMany({
        where: { id: { in: expenses.map((expense) => expense.id) } },
        data: { closureId: closure.id },
      });

      return closure;
    });

    return {
      closureId: result.id,
      balances,
    };
  }

  async simulate(userId: string, dto: CreateClosureDto) {
    await this.validateAdminMembership(userId, dto.householdId);

    const { startDate, endDate } = await this.getOpenExpensesPeriod(
      dto.householdId,
    );

    const expenses = await this.prisma.expenses.findMany({
      where: {
        householdId: dto.householdId,
        closureId: null,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { date: 'asc' },
      select: {
        id: true,
        amount: true,
        payers: {
          select: { userId: true, amountPaid: true },
        },
        splits: {
          select: { userId: true, amount: true },
        },
      },
    });

    if (expenses.length === 0) {
      throw new BadRequestException(
        'No open expenses available for closure in this period',
      );
    }

    const settlement = this.closureBalancesService.calculateSettlement(
      this.toExpenseInput(expenses),
    );

    return {
      period: {
        startDate,
        endDate,
      },
      expensesCount: expenses.length,
      balances: settlement.balances,
      debts: settlement.debts,
    };
  }

  async findAll(
    userId: string,
    householdId: string,
    query: ListClosuresQueryDto,
  ) {
    await this.validateMembership(userId, householdId);

    const limit = query.limit ?? 20;
    const offset = query.offset ?? 0;

    return this.prisma.closures.findMany({
      where: { householdId },
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit,
      select: {
        id: true,
        startDate: true,
        endDate: true,
        createdAt: true,
      },
    });
  }

  async findOne(userId: string, closureId: string) {
    const closure = await this.getClosureOrThrow(closureId);
    await this.validateMembership(userId, closure.householdId);

    return this.prisma.closures.findUnique({
      where: { id: closureId },
      select: {
        id: true,
        householdId: true,
        startDate: true,
        endDate: true,
        createdAt: true,
        updatedAt: true,
        balances: {
          select: {
            fromUserId: true,
            toUserId: true,
            amount: true,
          },
          orderBy: [{ fromUserId: 'asc' }, { toUserId: 'asc' }],
        },
      },
    });
  }

  async findBalances(userId: string, closureId: string) {
    const closure = await this.getClosureOrThrow(closureId);
    await this.validateMembership(userId, closure.householdId);

    return this.prisma.closureBalance.findMany({
      where: { closureId },
      orderBy: [{ fromUserId: 'asc' }, { toUserId: 'asc' }],
      select: {
        fromUserId: true,
        toUserId: true,
        amount: true,
      },
    });
  }

  async findExpenses(userId: string, closureId: string) {
    const closure = await this.getClosureOrThrow(closureId);
    await this.validateMembership(userId, closure.householdId);

    return this.prisma.expenses.findMany({
      where: { closureId },
      orderBy: [{ date: 'asc' }, { createdAt: 'asc' }],
      select: {
        id: true,
        title: true,
        description: true,
        amount: true,
        date: true,
        receiptUrl: true,
        createdAt: true,
        updatedAt: true,
        payers: {
          select: {
            userId: true,
            amountPaid: true,
          },
          orderBy: { userId: 'asc' },
        },
        splits: {
          select: {
            userId: true,
            amount: true,
          },
          orderBy: { userId: 'asc' },
        },
      },
    });
  }
}
