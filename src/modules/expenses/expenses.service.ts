import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role } from 'src/generated/prisma/client';
import { PrismaService } from 'src/modules/prisma/prisma.service';
import { CloudinaryService } from 'src/modules/cloudinary/cloudinary.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { UpdatePayersDto } from './dto/update-payers.dto';
import { UpdateSplitsDto } from './dto/update-splits.dto';
import { ListExpensesQueryDto } from './dto/list-expenses-query.dto';
import { PayerDto } from './dto/payer.dto';
import { SplitDto } from './dto/split.dto';

const RECEIPT_FOLDER = 'FinFam/img';

@Injectable()
export class ExpensesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinary: CloudinaryService,
  ) {}

  // ─── HELPERS ──────────────────────────────────────────────────────────────────

  private roundCents(value: number): number {
    return Math.round(value * 100);
  }

  private validateFinancialIntegrity(
    amount: number,
    payers: PayerDto[],
    splits: SplitDto[],
  ): void {
    const payersSum = payers.reduce((acc, p) => acc + p.amountPaid, 0);
    const splitsSum = splits.reduce((acc, s) => acc + s.amount, 0);

    if (this.roundCents(payersSum) !== this.roundCents(amount)) {
      throw new BadRequestException(
        `Payers sum (${payersSum}) does not match expense amount (${amount})`,
      );
    }

    if (this.roundCents(splitsSum) !== this.roundCents(amount)) {
      throw new BadRequestException(
        `Splits sum (${splitsSum}) does not match expense amount (${amount})`,
      );
    }
  }

  private async validateMembership(userId: string, householdId: string) {
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

  private async validateAllUsersAreMembersOfHousehold(
    userIds: string[],
    householdId: string,
  ): Promise<void> {
    const uniqueIds = [...new Set(userIds)];

    const memberships = await this.prisma.memberships.findMany({
      where: {
        householdId,
        userId: { in: uniqueIds },
      },
      select: { userId: true },
    });

    const foundIds = new Set(memberships.map((m) => m.userId));
    const missing = uniqueIds.filter((id) => !foundIds.has(id));

    if (missing.length > 0) {
      throw new BadRequestException(
        `Users not members of this household: ${missing.join(', ')}`,
      );
    }
  }

  private async getExpenseOrThrow(expenseId: string) {
    const expense = await this.prisma.expenses.findUnique({
      where: { id: expenseId },
    });

    if (!expense) throw new NotFoundException('Expense not found');
    return expense;
  }

  private guardClosed(closureId: string | null): void {
    if (closureId !== null) {
      throw new ForbiddenException(
        'Cannot modify an expense that belongs to a closed period',
      );
    }
  }

  // ─── CREATE EXPENSE ───────────────────────────────────────────────────────────

  async create(
    userId: string,
    dto: CreateExpenseDto,
    file?: Express.Multer.File,
  ) {
    await this.validateAdminMembership(userId, dto.householdId);

    const household = await this.prisma.households.findUnique({
      where: { id: dto.householdId },
    });
    if (!household) throw new NotFoundException('Household not found');

    const allUserIds = [
      ...dto.payers.map((p) => p.userId),
      ...dto.splits.map((s) => s.userId),
    ];
    await this.validateAllUsersAreMembersOfHousehold(
      allUserIds,
      dto.householdId,
    );

    this.validateFinancialIntegrity(dto.amount, dto.payers, dto.splits);

    let receiptUrl: string | null = null;
    let receiptPublicId: string | null = null;

    if (file) {
      const uploaded = await this.cloudinary.uploadFile(
        file.buffer,
        RECEIPT_FOLDER,
        'image',
      );
      receiptUrl = uploaded.url;
      receiptPublicId = uploaded.publicId;
    }

    return this.prisma.$transaction(async (tx) => {
      const expense = await tx.expenses.create({
        data: {
          householdId: dto.householdId,
          title: dto.title,
          description: dto.description,
          amount: dto.amount,
          date: new Date(dto.date),
          receiptUrl,
          receiptPublicId,
          createdBy: userId,
        },
      });

      await tx.expensePayers.createMany({
        data: dto.payers.map((p) => ({
          expenseId: expense.id,
          userId: p.userId,
          amountPaid: p.amountPaid,
        })),
      });

      await tx.expenseSplits.createMany({
        data: dto.splits.map((s) => ({
          expenseId: expense.id,
          userId: s.userId,
          amount: s.amount,
        })),
      });

      return expense;
    });
  }

  // ─── LIST EXPENSES ────────────────────────────────────────────────────────────

  async findAll(
    userId: string,
    householdId: string,
    query: ListExpensesQueryDto,
  ) {
    await this.validateMembership(userId, householdId);

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { householdId };

    if (query.closureId) {
      where.closureId = query.closureId;
    }

    if (query.startDate || query.endDate) {
      const dateFilter: Record<string, Date> = {};
      if (query.startDate) dateFilter.gte = new Date(query.startDate);
      if (query.endDate) dateFilter.lte = new Date(query.endDate);
      where.date = dateFilter;
    }

    const [expenses, total] = await Promise.all([
      this.prisma.expenses.findMany({
        where,
        orderBy: { date: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          title: true,
          amount: true,
          date: true,
          closureId: true,
        },
      }),
      this.prisma.expenses.count({ where }),
    ]);

    return {
      data: expenses,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  // ─── FIND ONE ─────────────────────────────────────────────────────────────────

  async findOne(userId: string, expenseId: string) {
    const expense = await this.prisma.expenses.findUnique({
      where: { id: expenseId },
      include: {
        payers: {
          select: {
            id: true,
            userId: true,
            amountPaid: true,
            user: { select: { name: true, lastName: true } },
          },
        },
        splits: {
          select: {
            id: true,
            userId: true,
            amount: true,
            user: { select: { name: true, lastName: true } },
          },
        },
      },
    });

    if (!expense) throw new NotFoundException('Expense not found');

    await this.validateMembership(userId, expense.householdId);

    return expense;
  }

  // ─── UPDATE EXPENSE ───────────────────────────────────────────────────────────

  async update(
    userId: string,
    expenseId: string,
    dto: UpdateExpenseDto,
    file?: Express.Multer.File,
  ) {
    const expense = await this.getExpenseOrThrow(expenseId);
    this.guardClosed(expense.closureId);
    await this.validateAdminMembership(userId, expense.householdId);

    const newAmount = dto.amount ?? Number(expense.amount);
    const newPayers = dto.payers;
    const newSplits = dto.splits;

    if (newPayers || newSplits) {
      const payers =
        newPayers ??
        (
          await this.prisma.expensePayers.findMany({
            where: { expenseId },
            select: { userId: true, amountPaid: true },
          })
        ).map((p) => ({ userId: p.userId, amountPaid: Number(p.amountPaid) }));

      const splits =
        newSplits ??
        (
          await this.prisma.expenseSplits.findMany({
            where: { expenseId },
            select: { userId: true, amount: true },
          })
        ).map((s) => ({ userId: s.userId, amount: Number(s.amount) }));

      this.validateFinancialIntegrity(newAmount, payers, splits);

      const allUserIds = [
        ...payers.map((p) => p.userId),
        ...splits.map((s) => s.userId),
      ];
      await this.validateAllUsersAreMembersOfHousehold(
        allUserIds,
        expense.householdId,
      );
    }

    let receiptUrl = expense.receiptUrl;
    let receiptPublicId = expense.receiptPublicId;

    if (file) {
      if (expense.receiptPublicId) {
        await this.cloudinary.deleteFile(expense.receiptPublicId, 'image');
      }
      const uploaded = await this.cloudinary.uploadFile(
        file.buffer,
        RECEIPT_FOLDER,
        'image',
      );
      receiptUrl = uploaded.url;
      receiptPublicId = uploaded.publicId;
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.expenses.update({
        where: { id: expenseId },
        data: {
          ...(dto.title !== undefined && { title: dto.title }),
          ...(dto.description !== undefined && {
            description: dto.description,
          }),
          ...(dto.amount !== undefined && { amount: dto.amount }),
          ...(dto.date !== undefined && { date: new Date(dto.date) }),
          receiptUrl,
          receiptPublicId,
        },
      });

      if (newPayers) {
        await tx.expensePayers.deleteMany({ where: { expenseId } });
        await tx.expensePayers.createMany({
          data: newPayers.map((p) => ({
            expenseId,
            userId: p.userId,
            amountPaid: p.amountPaid,
          })),
        });
      }

      if (newSplits) {
        await tx.expenseSplits.deleteMany({ where: { expenseId } });
        await tx.expenseSplits.createMany({
          data: newSplits.map((s) => ({
            expenseId,
            userId: s.userId,
            amount: s.amount,
          })),
        });
      }

      return updated;
    });
  }

  // ─── DELETE EXPENSE ───────────────────────────────────────────────────────────

  async remove(userId: string, expenseId: string) {
    const expense = await this.getExpenseOrThrow(expenseId);
    this.guardClosed(expense.closureId);
    await this.validateAdminMembership(userId, expense.householdId);

    if (expense.receiptPublicId) {
      await this.cloudinary.deleteFile(expense.receiptPublicId, 'image');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.expensePayers.deleteMany({ where: { expenseId } });
      await tx.expenseSplits.deleteMany({ where: { expenseId } });
      await tx.expenses.delete({ where: { id: expenseId } });
    });

    return { message: 'Expense deleted successfully' };
  }

  // ─── UPDATE PAYERS ────────────────────────────────────────────────────────────

  async updatePayers(userId: string, expenseId: string, dto: UpdatePayersDto) {
    const expense = await this.getExpenseOrThrow(expenseId);
    this.guardClosed(expense.closureId);
    await this.validateAdminMembership(userId, expense.householdId);

    const payersSum = dto.payers.reduce((acc, p) => acc + p.amountPaid, 0);
    if (
      this.roundCents(payersSum) !== this.roundCents(Number(expense.amount))
    ) {
      throw new BadRequestException(
        `Payers sum (${payersSum}) does not match expense amount (${expense.amount})`,
      );
    }

    await this.validateAllUsersAreMembersOfHousehold(
      dto.payers.map((p) => p.userId),
      expense.householdId,
    );

    return this.prisma.$transaction(async (tx) => {
      for (const payer of dto.payers) {
        await tx.expensePayers.upsert({
          where: { expenseId_userId: { expenseId, userId: payer.userId } },
          update: { amountPaid: payer.amountPaid },
          create: {
            expenseId,
            userId: payer.userId,
            amountPaid: payer.amountPaid,
          },
        });
      }

      const keepUserIds = dto.payers.map((p) => p.userId);
      await tx.expensePayers.deleteMany({
        where: { expenseId, userId: { notIn: keepUserIds } },
      });

      return tx.expensePayers.findMany({ where: { expenseId } });
    });
  }

  // ─── UPDATE SPLITS ────────────────────────────────────────────────────────────

  async updateSplits(userId: string, expenseId: string, dto: UpdateSplitsDto) {
    const expense = await this.getExpenseOrThrow(expenseId);
    this.guardClosed(expense.closureId);
    await this.validateAdminMembership(userId, expense.householdId);

    const splitsSum = dto.splits.reduce((acc, s) => acc + s.amount, 0);
    if (
      this.roundCents(splitsSum) !== this.roundCents(Number(expense.amount))
    ) {
      throw new BadRequestException(
        `Splits sum (${splitsSum}) does not match expense amount (${expense.amount})`,
      );
    }

    await this.validateAllUsersAreMembersOfHousehold(
      dto.splits.map((s) => s.userId),
      expense.householdId,
    );

    return this.prisma.$transaction(async (tx) => {
      for (const split of dto.splits) {
        await tx.expenseSplits.upsert({
          where: { expenseId_userId: { expenseId, userId: split.userId } },
          update: { amount: split.amount },
          create: {
            expenseId,
            userId: split.userId,
            amount: split.amount,
          },
        });
      }

      const keepUserIds = dto.splits.map((s) => s.userId);
      await tx.expenseSplits.deleteMany({
        where: { expenseId, userId: { notIn: keepUserIds } },
      });

      return tx.expenseSplits.findMany({ where: { expenseId } });
    });
  }

  // ─── GET FOR CALCULATION ──────────────────────────────────────────────────────

  async getForCalculation(userId: string, householdId: string) {
    await this.validateMembership(userId, householdId);

    const expenses = await this.prisma.expenses.findMany({
      where: { householdId },
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

    return expenses;
  }
}
