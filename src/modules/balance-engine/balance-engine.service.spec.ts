/// <reference types="jest" />
import { BadRequestException } from '@nestjs/common';
import { BalanceEngineService } from './balance-engine.service';
import { ExpenseInput, SettlementResult } from './balance-engine.interfaces';

// ─── FIXTURE HELPERS ──────────────────────────────────────────────────────────

function makeExpense(
  id: string,
  amount: number,
  payers: [string, number][],
  splits: [string, number][],
): ExpenseInput {
  return {
    id,
    amount,
    payers: payers.map(([userId, amountPaid]) => ({ userId, amountPaid })),
    splits: splits.map(([userId, amount]) => ({ userId, amount })),
  };
}

function getBalance(result: SettlementResult, userId: string): number {
  return result.balances.find((b) => b.userId === userId)?.balance ?? 0;
}

// ─── ACCOUNTING PROPERTIES HELPER ────────────────────────────────────────────

/**
 * Verifica las propiedades contables básicas del resultado:
 * 1. Suma de balances = 0
 * 2. Suma de deudas = suma de balances positivos
 * 3. Ninguna deuda con monto negativo o cero
 */
function assertAccountingProperties(result: SettlementResult): void {
  // Propiedad 1: suma de balances = 0
  const balanceSum = result.balances.reduce((acc, b) => acc + b.balance, 0);
  expect(Math.round(balanceSum * 100)).toBe(0);

  // Propiedad 2: suma de deudas = suma de balances positivos
  const positiveSum = result.balances
    .filter((b) => b.balance > 0)
    .reduce((acc, b) => acc + b.balance, 0);
  const debtSum = result.debts.reduce((acc, d) => acc + d.amount, 0);
  expect(Math.round(debtSum * 100)).toBe(Math.round(positiveSum * 100));

  // Propiedad 4: ningún monto negativo o cero en deudas
  for (const debt of result.debts) {
    expect(debt.amount).toBeGreaterThan(0);
  }
}

// ─── TESTS ────────────────────────────────────────────────────────────────────

describe('BalanceEngineService', () => {
  let service: BalanceEngineService;

  // El servicio es puro — sin dependencias externas, se instancia directamente
  beforeEach(() => {
    service = new BalanceEngineService();
  });

  // ─── 1. TESTS FUNCIONALES BÁSICOS ─────────────────────────────────────────

  describe('Functional tests — basic scenarios', () => {
    it('Case 1: single payer, three consumers', () => {
      // A paga 60 — A/B/C consumen 20 cada uno
      const expenses = [
        makeExpense(
          'e1',
          60,
          [['A', 60]],
          [
            ['A', 20],
            ['B', 20],
            ['C', 20],
          ],
        ),
      ];

      const result = service.calculateSettlement(expenses);

      expect(getBalance(result, 'A')).toBe(40);
      expect(getBalance(result, 'B')).toBe(-20);
      expect(getBalance(result, 'C')).toBe(-20);
      expect(result.debts).toHaveLength(2);
      expect(result.debts).toContainEqual({
        fromUserId: 'B',
        toUserId: 'A',
        amount: 20,
      });
      expect(result.debts).toContainEqual({
        fromUserId: 'C',
        toUserId: 'A',
        amount: 20,
      });
    });

    it('Case 2: each person pays their exact share — no debts', () => {
      // A paga 20, B paga 20, C paga 20 — todos consumen 20
      const expenses = [
        makeExpense(
          'e1',
          60,
          [
            ['A', 20],
            ['B', 20],
            ['C', 20],
          ],
          [
            ['A', 20],
            ['B', 20],
            ['C', 20],
          ],
        ),
      ];

      const result = service.calculateSettlement(expenses);

      expect(result.debts).toHaveLength(0);
      expect(getBalance(result, 'A')).toBe(0);
      expect(getBalance(result, 'B')).toBe(0);
      expect(getBalance(result, 'C')).toBe(0);
    });

    it('Case 3: payer does not consume', () => {
      // C paga 100 — A consume 50, B consume 50
      const expenses = [
        makeExpense(
          'e1',
          100,
          [['C', 100]],
          [
            ['A', 50],
            ['B', 50],
          ],
        ),
      ];

      const result = service.calculateSettlement(expenses);

      expect(getBalance(result, 'A')).toBe(-50);
      expect(getBalance(result, 'B')).toBe(-50);
      expect(getBalance(result, 'C')).toBe(100);
      expect(result.debts).toContainEqual({
        fromUserId: 'A',
        toUserId: 'C',
        amount: 50,
      });
      expect(result.debts).toContainEqual({
        fromUserId: 'B',
        toUserId: 'C',
        amount: 50,
      });
    });

    it('Case 4: multiple payers split a single expense', () => {
      // Gasto 60 — A paga 30, B paga 30 — A/B/C consumen 20 cada uno
      const expenses = [
        makeExpense(
          'e1',
          60,
          [
            ['A', 30],
            ['B', 30],
          ],
          [
            ['A', 20],
            ['B', 20],
            ['C', 20],
          ],
        ),
      ];

      const result = service.calculateSettlement(expenses);

      expect(getBalance(result, 'A')).toBe(10);
      expect(getBalance(result, 'B')).toBe(10);
      expect(getBalance(result, 'C')).toBe(-20);
      expect(result.debts).toContainEqual({
        fromUserId: 'C',
        toUserId: 'A',
        amount: 10,
      });
      expect(result.debts).toContainEqual({
        fromUserId: 'C',
        toUserId: 'B',
        amount: 10,
      });
    });

    it('Case 5: accumulated balances across two expenses', () => {
      // Gasto 1: A paga 60 — A/B/C consumen 20  → A:+40, B:-20, C:-20
      // Gasto 2: B paga 30 — A/B/C consumen 10  → A:-10, B:+20, C:-10
      // Total acumulado:                           A:+30, B:0,   C:-30
      const expenses = [
        makeExpense(
          'e1',
          60,
          [['A', 60]],
          [
            ['A', 20],
            ['B', 20],
            ['C', 20],
          ],
        ),
        makeExpense(
          'e2',
          30,
          [['B', 30]],
          [
            ['A', 10],
            ['B', 10],
            ['C', 10],
          ],
        ),
      ];

      const result = service.calculateSettlement(expenses);

      expect(getBalance(result, 'A')).toBe(30);
      expect(getBalance(result, 'B')).toBe(0);
      expect(getBalance(result, 'C')).toBe(-30);
      expect(result.debts).toHaveLength(1);
      expect(result.debts).toContainEqual({
        fromUserId: 'C',
        toUserId: 'A',
        amount: 30,
      });
    });
  });

  // ─── 2. PROPIEDADES CONTABLES (CRÍTICOS) ──────────────────────────────────

  describe('Accounting properties (critical)', () => {
    it('Property 1: sum of all balances is always 0', () => {
      const expenses = [
        makeExpense(
          'e1',
          60,
          [['A', 60]],
          [
            ['A', 20],
            ['B', 20],
            ['C', 20],
          ],
        ),
        makeExpense(
          'e2',
          45,
          [
            ['B', 30],
            ['C', 15],
          ],
          [
            ['A', 15],
            ['B', 15],
            ['C', 15],
          ],
        ),
      ];

      const result = service.calculateSettlement(expenses);

      const sum = result.balances.reduce((acc, b) => acc + b.balance, 0);
      expect(Math.round(sum * 100)).toBe(0);
    });

    it('Property 2: sum of debts equals sum of positive balances', () => {
      const expenses = [
        makeExpense(
          'e1',
          60,
          [['A', 60]],
          [
            ['A', 20],
            ['B', 20],
            ['C', 20],
          ],
        ),
      ];

      const result = service.calculateSettlement(expenses);

      assertAccountingProperties(result);
    });

    it('Property 3: applying all debts zeroes out every balance', () => {
      const expenses = [
        makeExpense(
          'e1',
          60,
          [['A', 60]],
          [
            ['A', 20],
            ['B', 20],
            ['C', 20],
          ],
        ),
        makeExpense(
          'e2',
          30,
          [['B', 30]],
          [
            ['A', 10],
            ['B', 10],
            ['C', 10],
          ],
        ),
      ];

      const result = service.calculateSettlement(expenses);

      // Simular aplicación de deudas sobre los balances
      const tempBalances = new Map<string, number>();
      for (const { userId, balance } of result.balances) {
        tempBalances.set(userId, Math.round(balance * 100));
      }
      for (const { fromUserId, toUserId, amount } of result.debts) {
        const cents = Math.round(amount * 100);
        tempBalances.set(
          fromUserId,
          (tempBalances.get(fromUserId) ?? 0) + cents,
        );
        tempBalances.set(toUserId, (tempBalances.get(toUserId) ?? 0) - cents);
      }

      for (const [, balance] of tempBalances) {
        expect(balance).toBe(0);
      }
    });

    it('Property 4: no debt has a negative or zero amount', () => {
      const expenses = [
        makeExpense(
          'e1',
          90,
          [['A', 90]],
          [
            ['A', 30],
            ['B', 30],
            ['C', 30],
          ],
        ),
      ];

      const result = service.calculateSettlement(expenses);

      for (const debt of result.debts) {
        expect(debt.amount).toBeGreaterThan(0);
      }
    });

    it('Property 5: engine is deterministic — same input, same output', () => {
      const expenses = [
        makeExpense(
          'e1',
          60,
          [['A', 60]],
          [
            ['A', 20],
            ['B', 20],
            ['C', 20],
          ],
        ),
        makeExpense(
          'e2',
          30,
          [['B', 30]],
          [
            ['A', 10],
            ['B', 10],
            ['C', 10],
          ],
        ),
      ];

      const result1 = service.calculateSettlement(expenses);
      const result2 = service.calculateSettlement(expenses);

      expect(result1).toEqual(result2);
    });
  });

  // ─── 3. EDGE CASES ────────────────────────────────────────────────────────

  describe('Edge cases', () => {
    it('Edge 1: rounding — 100 split among 3 (33.33 + 33.33 + 33.34)', () => {
      const expenses = [
        makeExpense(
          'e1',
          100,
          [['A', 100]],
          [
            ['A', 33.33],
            ['B', 33.33],
            ['C', 33.34],
          ],
        ),
      ];

      const result = service.calculateSettlement(expenses);

      assertAccountingProperties(result);
      const sum = result.balances.reduce((acc, b) => acc + b.balance, 0);
      expect(Math.round(sum * 100)).toBe(0);
    });

    it('Edge 2: user with zero balance is not included in any debt', () => {
      // Expense 1: A pays 20, A/C consume 10 each → A:+10, C:-10
      // Expense 2: C pays 10, B consumes 10      → C:+10, B:-10
      // Total: A:+10, B:-10, C:0
      const expenses = [
        makeExpense(
          'e1',
          20,
          [['A', 20]],
          [
            ['A', 10],
            ['C', 10],
          ],
        ),
        makeExpense('e2', 10, [['C', 10]], [['B', 10]]),
      ];

      const result = service.calculateSettlement(expenses);

      expect(getBalance(result, 'C')).toBe(0);
      const cInDebts = result.debts.some(
        (d) => d.fromUserId === 'C' || d.toUserId === 'C',
      );
      expect(cInDebts).toBe(false);
    });

    it('Edge 3: large group (10 users) completes without hanging', () => {
      const users = [
        'U1',
        'U2',
        'U3',
        'U4',
        'U5',
        'U6',
        'U7',
        'U8',
        'U9',
        'U10',
      ];
      const perUser = 10;
      const total = users.length * perUser;

      const expenses = [
        makeExpense(
          'e1',
          total,
          [['U1', total]],
          users.map((u) => [u, perUser] as [string, number]),
        ),
      ];

      const result = service.calculateSettlement(expenses);

      assertAccountingProperties(result);
      expect(result.debts.length).toBeGreaterThan(0);
    });

    it('Edge 4a: splits do not sum to amount — throws BadRequestException', () => {
      const malformed: ExpenseInput = {
        id: 'bad',
        amount: 100,
        payers: [{ userId: 'A', amountPaid: 100 }],
        splits: [
          { userId: 'A', amount: 40 },
          { userId: 'B', amount: 40 },
          // falta 20 — splits suman 80 ≠ 100
        ],
      };

      expect(() => service.calculateSettlement([malformed])).toThrow(
        BadRequestException,
      );
    });

    it('Edge 4b: payers do not sum to amount — throws BadRequestException', () => {
      const malformed: ExpenseInput = {
        id: 'bad',
        amount: 100,
        payers: [{ userId: 'A', amountPaid: 90 }], // 90 ≠ 100
        splits: [
          { userId: 'A', amount: 50 },
          { userId: 'B', amount: 50 },
        ],
      };

      expect(() => service.calculateSettlement([malformed])).toThrow(
        BadRequestException,
      );
    });

    it('Edge 5: user pays in one expense and consumes in another — accumulates correctly', () => {
      // A paga gasto 1, consume en gasto 2
      // B paga gasto 2, consume en gasto 1
      // Balance final: A 0, B 0 — sin deudas
      const expenses = [
        makeExpense(
          'e1',
          40,
          [['A', 40]],
          [
            ['A', 20],
            ['B', 20],
          ],
        ),
        makeExpense(
          'e2',
          40,
          [['B', 40]],
          [
            ['A', 20],
            ['B', 20],
          ],
        ),
      ];

      const result = service.calculateSettlement(expenses);

      expect(getBalance(result, 'A')).toBe(0);
      expect(getBalance(result, 'B')).toBe(0);
      expect(result.debts).toHaveLength(0);
    });

    it('Edge 6: symmetric creditors and debtors — minimizes number of transfers', () => {
      // A +2, B +2, C -2, D -2 → algoritmo greedy produce 2 deudas, no 4
      const expenses = [
        makeExpense(
          'e1',
          4,
          [
            ['A', 2],
            ['B', 2],
          ],
          [
            ['C', 2],
            ['D', 2],
          ],
        ),
      ];

      const result = service.calculateSettlement(expenses);

      expect(result.debts.length).toBeLessThanOrEqual(2);
      assertAccountingProperties(result);
    });

    it('Edge 7: empty expense list returns empty balances and debts', () => {
      const result = service.calculateSettlement([]);

      expect(result.balances).toHaveLength(0);
      expect(result.debts).toHaveLength(0);
    });

    it('Edge 8: single user pays and consumes fully — no debts', () => {
      const expenses = [makeExpense('e1', 50, [['A', 50]], [['A', 50]])];

      const result = service.calculateSettlement(expenses);

      expect(result.debts).toHaveLength(0);
      expect(getBalance(result, 'A')).toBe(0);
    });
  });

  // ─── 4. CICLO DE PAGOS ────────────────────────────────────────────────────

  describe('Payment cycle — circular debts cancel out', () => {
    it('A pays for B, B pays for C, C pays for A — balance zero, no debts', () => {
      const expenses = [
        makeExpense('e1', 20, [['A', 20]], [['B', 20]]),
        makeExpense('e2', 20, [['B', 20]], [['C', 20]]),
        makeExpense('e3', 20, [['C', 20]], [['A', 20]]),
      ];

      const result = service.calculateSettlement(expenses);

      expect(getBalance(result, 'A')).toBe(0);
      expect(getBalance(result, 'B')).toBe(0);
      expect(getBalance(result, 'C')).toBe(0);
      expect(result.debts).toHaveLength(0);
    });
  });

  // ─── 5. TEST DE ESTRÉS ────────────────────────────────────────────────────

  describe('Stress test — 100 expenses, 10 users', () => {
    /**
     * Genera N gastos deterministicos: en cada gasto un único pagador
     * (rotando por índice) cubre el total, y todos consumen por igual.
     */
    function generateExpenses(count: number, users: string[]): ExpenseInput[] {
      const perUser = 10;
      const total = users.length * perUser;

      return Array.from({ length: count }, (_, i) => {
        const payerId = users[i % users.length];
        return makeExpense(
          `stress-${i}`,
          total,
          [[payerId, total]],
          users.map((u) => [u, perUser] as [string, number]),
        );
      });
    }

    it('accounting properties hold for 100 expenses and 10 users', () => {
      const users = Array.from({ length: 10 }, (_, i) => `U${i + 1}`);
      const expenses = generateExpenses(100, users);

      const result = service.calculateSettlement(expenses);

      assertAccountingProperties(result);
    });

    it('all balance values are finite after stress run', () => {
      const users = Array.from({ length: 10 }, (_, i) => `U${i + 1}`);
      const expenses = generateExpenses(100, users);

      const result = service.calculateSettlement(expenses);

      for (const { balance } of result.balances) {
        expect(isFinite(balance)).toBe(true);
        expect(isNaN(balance)).toBe(false);
      }
    });

    it('no negative debt amounts after stress run', () => {
      const users = Array.from({ length: 10 }, (_, i) => `U${i + 1}`);
      const expenses = generateExpenses(100, users);

      const result = service.calculateSettlement(expenses);

      for (const { amount } of result.debts) {
        expect(amount).toBeGreaterThan(0);
      }
    });
  });

  // ─── 6. SIMULACIÓN VS CIERRE ──────────────────────────────────────────────

  describe('Simulation vs settlement — identical results', () => {
    it('two consecutive calls with the same expenses produce identical output', () => {
      const expenses = [
        makeExpense(
          'e1',
          60,
          [['A', 60]],
          [
            ['A', 20],
            ['B', 20],
            ['C', 20],
          ],
        ),
        makeExpense(
          'e2',
          30,
          [['B', 30]],
          [
            ['A', 10],
            ['B', 10],
            ['C', 10],
          ],
        ),
        makeExpense(
          'e3',
          90,
          [
            ['C', 45],
            ['A', 45],
          ],
          [
            ['A', 30],
            ['B', 30],
            ['C', 30],
          ],
        ),
      ];

      const simulation = service.calculateSettlement(expenses);
      const settlement = service.calculateSettlement(expenses);

      expect(simulation).toEqual(settlement);
    });
  });

  // ─── filterForUser ────────────────────────────────────────────────────────

  describe('filterForUser', () => {
    it('returns correct debts to pay and receive for a given user', () => {
      const expenses = [
        makeExpense(
          'e1',
          60,
          [['A', 60]],
          [
            ['A', 20],
            ['B', 20],
            ['C', 20],
          ],
        ),
      ];
      const settlement = service.calculateSettlement(expenses);

      const resultA = service.filterForUser('A', settlement);
      expect(resultA.balance).toBe(40);
      expect(resultA.debtsToPay).toHaveLength(0);
      expect(resultA.debtsToReceive).toHaveLength(2);

      const resultB = service.filterForUser('B', settlement);
      expect(resultB.balance).toBe(-20);
      expect(resultB.debtsToPay).toHaveLength(1);
      expect(resultB.debtsToReceive).toHaveLength(0);
      expect(resultB.debtsToPay[0]).toEqual({
        fromUserId: 'B',
        toUserId: 'A',
        amount: 20,
      });
    });

    it('returns zero balance and empty arrays for an unknown user', () => {
      const expenses = [
        makeExpense(
          'e1',
          60,
          [['A', 60]],
          [
            ['A', 30],
            ['B', 30],
          ],
        ),
      ];
      const settlement = service.calculateSettlement(expenses);

      const resultZ = service.filterForUser('Z', settlement);

      expect(resultZ.balance).toBe(0);
      expect(resultZ.debtsToPay).toHaveLength(0);
      expect(resultZ.debtsToReceive).toHaveLength(0);
    });
  });

  // ─── calculateBalances (aislado) ──────────────────────────────────────────

  describe('calculateBalances', () => {
    it('returns balances sorted by userId for determinism', () => {
      const expenses = [
        makeExpense(
          'e1',
          60,
          [['C', 60]],
          [
            ['A', 20],
            ['B', 20],
            ['C', 20],
          ],
        ),
      ];

      const balances = service.calculateBalances(expenses);

      const ids = balances.map((b) => b.userId);
      expect(ids).toEqual([...ids].sort());
    });

    it('throws BadRequestException for invalid splits', () => {
      const invalid: ExpenseInput = {
        id: 'x',
        amount: 100,
        payers: [{ userId: 'A', amountPaid: 100 }],
        splits: [{ userId: 'A', amount: 50 }], // 50 ≠ 100
      };

      expect(() => service.calculateBalances([invalid])).toThrow(
        BadRequestException,
      );
    });
  });

  // ─── calculateDebts (aislado) ─────────────────────────────────────────────

  describe('calculateDebts', () => {
    it('returns empty array when all balances are zero', () => {
      const debts = service.calculateDebts([
        { userId: 'A', balance: 0 },
        { userId: 'B', balance: 0 },
      ]);

      expect(debts).toHaveLength(0);
    });

    it('handles single creditor and single debtor', () => {
      const debts = service.calculateDebts([
        { userId: 'A', balance: 50 },
        { userId: 'B', balance: -50 },
      ]);

      expect(debts).toHaveLength(1);
      expect(debts[0]).toEqual({
        fromUserId: 'B',
        toUserId: 'A',
        amount: 50,
      });
    });

    it('handles creditor with multiple debtors', () => {
      // A recibe 40, B debe 20, C debe 20
      const debts = service.calculateDebts([
        { userId: 'A', balance: 40 },
        { userId: 'B', balance: -20 },
        { userId: 'C', balance: -20 },
      ]);

      expect(debts).toHaveLength(2);
      const total = debts.reduce((acc, d) => acc + d.amount, 0);
      expect(total).toBe(40);
    });
  });
});
