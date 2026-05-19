import { Injectable } from '@nestjs/common';
import { BalanceEngineService } from 'src/modules/balance-engine/balance-engine.service';
import type {
  Debt,
  ExpenseInput,
  SettlementResult,
} from 'src/modules/balance-engine/balance-engine.interfaces';

@Injectable()
export class ClosureBalancesService {
  constructor(private readonly balanceEngine: BalanceEngineService) {}

  calculateSettlement(expenses: ExpenseInput[]): SettlementResult {
    return this.balanceEngine.calculateSettlement(expenses);
  }

  calculate(expenses: ExpenseInput[]): Debt[] {
    return this.calculateSettlement(expenses).debts;
  }

  toCreateManyData(closureId: string, debts: Debt[]) {
    return debts.map((debt) => ({
      closureId,
      fromUserId: debt.fromUserId,
      toUserId: debt.toUserId,
      amount: debt.amount,
    }));
  }
}
