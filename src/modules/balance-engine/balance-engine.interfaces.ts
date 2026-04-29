/**
 * Tipo compatible con Prisma Decimal y number.
 * Acepta cualquier valor que pueda convertirse a número con Number().
 */
type DecimalLike = number | string | { toNumber(): number };

export interface ExpenseInput {
  id: string;
  amount: DecimalLike;
  payers: PayerInput[];
  splits: SplitInput[];
}

export interface PayerInput {
  userId: string;
  amountPaid: DecimalLike;
}

export interface SplitInput {
  userId: string;
  amount: DecimalLike;
}

export interface UserBalance {
  userId: string;
  balance: number;
}

export interface Debt {
  fromUserId: string;
  toUserId: string;
  amount: number;
}

export interface SettlementResult {
  balances: UserBalance[];
  debts: Debt[];
}

export interface UserSettlementResult {
  balance: number;
  debtsToPay: Debt[];
  debtsToReceive: Debt[];
}
