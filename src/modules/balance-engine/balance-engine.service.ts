import { BadRequestException, Injectable } from '@nestjs/common';
import {
  Debt,
  ExpenseInput,
  SettlementResult,
  UserBalance,
  UserSettlementResult,
} from './balance-engine.interfaces';

@Injectable()
export class BalanceEngineService {
  // ─── HELPERS ──────────────────────────────────────────────────────────────────

  /**
   * Convierte Decimal a centavos (entero) para evitar errores de punto flotante.
   */
  private toCents(value: unknown): number {
    return Math.round(Number(value) * 100);
  }

  /**
   * Convierte centavos a un número con dos decimales.
   */
  private fromCents(cents: number): number {
    return Math.round(cents) / 100;
  }

  // ─── VALIDACIÓN ───────────────────────────────────────────────────────────────

  private validateExpenses(expenses: ExpenseInput[]): void {
    for (const expense of expenses) {
      const amountCents = this.toCents(expense.amount);

      const payersSum = expense.payers.reduce(
        (acc, p) => acc + this.toCents(p.amountPaid),
        0,
      );

      const splitsSum = expense.splits.reduce(
        (acc, s) => acc + this.toCents(s.amount),
        0,
      );

      if (payersSum !== amountCents) {
        throw new BadRequestException(
          `Expense ${expense.id}: payers sum (${this.fromCents(payersSum)}) does not match amount (${this.fromCents(amountCents)})`,
        );
      }

      if (splitsSum !== amountCents) {
        throw new BadRequestException(
          `Expense ${expense.id}: splits sum (${this.fromCents(splitsSum)}) does not match amount (${this.fromCents(amountCents)})`,
        );
      }
    }
  }

  // ─── CALCULAR BALANCES ────────────────────────────────────────────────────────

  calculateBalances(expenses: ExpenseInput[]): UserBalance[] {
    this.validateExpenses(expenses);

    // Mapa userId → balance en centavos
    const balanceMap = new Map<string, number>();

    for (const expense of expenses) {
      for (const payer of expense.payers) {
        const prev = balanceMap.get(payer.userId) ?? 0;
        balanceMap.set(payer.userId, prev + this.toCents(payer.amountPaid));
      }

      for (const split of expense.splits) {
        const prev = balanceMap.get(split.userId) ?? 0;
        balanceMap.set(split.userId, prev - this.toCents(split.amount));
      }
    }

    // Convertir a array ordenado por userId para determinismo
    return Array.from(balanceMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([userId, cents]) => ({
        userId,
        balance: this.fromCents(cents),
      }));
  }

  // ─── CALCULAR DEUDAS OPTIMIZADAS ─────────────────────────────────────────────

  calculateDebts(balances: UserBalance[]): Debt[] {
    // Trabajar en centavos para evitar errores de punto flotante
    const creditors: { userId: string; amount: number }[] = [];
    const debtors: { userId: string; amount: number }[] = [];

    for (const { userId, balance } of balances) {
      const cents = Math.round(balance * 100);
      if (cents > 0) {
        creditors.push({ userId, amount: cents });
      } else if (cents < 0) {
        debtors.push({ userId, amount: Math.abs(cents) });
      }
      // balance === 0 → ignorar
    }

    // Ordenar para determinismo: acreedores mayor a menor, deudores mayor a menor
    creditors.sort(
      (a, b) => b.amount - a.amount || a.userId.localeCompare(b.userId),
    );
    debtors.sort(
      (a, b) => b.amount - a.amount || a.userId.localeCompare(b.userId),
    );

    const debts: Debt[] = [];
    let ci = 0;
    let di = 0;

    while (ci < creditors.length && di < debtors.length) {
      const creditor = creditors[ci];
      const debtor = debtors[di];

      const payment = Math.min(debtor.amount, creditor.amount);

      debts.push({
        fromUserId: debtor.userId,
        toUserId: creditor.userId,
        amount: this.fromCents(payment),
      });

      creditor.amount -= payment;
      debtor.amount -= payment;

      if (creditor.amount === 0) ci++;
      if (debtor.amount === 0) di++;
    }

    return debts;
  }

  // ─── MOTOR COMPLETO ───────────────────────────────────────────────────────────

  calculateSettlement(expenses: ExpenseInput[]): SettlementResult {
    const balances = this.calculateBalances(expenses);
    const debts = this.calculateDebts(balances);

    return { balances, debts };
  }

  // ─── FILTRAR PARA UN USUARIO ──────────────────────────────────────────────────

  filterForUser(
    userId: string,
    settlementResult: SettlementResult,
  ): UserSettlementResult {
    const userBalance = settlementResult.balances.find(
      (b) => b.userId === userId,
    );

    return {
      balance: userBalance?.balance ?? 0,
      debtsToPay: settlementResult.debts.filter((d) => d.fromUserId === userId),
      debtsToReceive: settlementResult.debts.filter(
        (d) => d.toUserId === userId,
      ),
    };
  }
}
