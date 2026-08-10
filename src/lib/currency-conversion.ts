import { convertMoney } from './currency';
import type { CurrencyCode } from './currency';
import type { BalanceSnapshot, Budget, Goal } from './types';

export interface FinancialData {
  budget?: Budget;
  goals: Goal[];
  balanceSnapshots: BalanceSnapshot[];
}

/** Convertit toutes les valeurs financières persistées, sans modifier les dates ni les cycles. */
export function convertFinancialData(
  state: FinancialData,
  rate: number,
  targetCurrency: CurrencyCode
): FinancialData {
  const convert = (amount: number) => convertMoney(amount, rate, targetCurrency);
  return {
    budget: state.budget
      ? {
          income: convert(state.budget.income),
          fixedCharges: convert(state.budget.fixedCharges),
          variableExpenses: convert(state.budget.variableExpenses),
        }
      : undefined,
    goals: state.goals.map((goal) => ({
      ...goal,
      targetAmount: convert(goal.targetAmount),
      alreadyAvailable: convert(goal.alreadyAvailable),
      confirmedBalance:
        goal.confirmedBalance === undefined ? undefined : convert(goal.confirmedBalance),
      contributions: goal.contributions.map((contribution) => ({
        ...contribution,
        amount: convert(contribution.amount),
      })),
    })),
    balanceSnapshots: state.balanceSnapshots.map((snapshot) => ({
      ...snapshot,
      amount: convert(snapshot.amount),
      allocations: Object.fromEntries(
        Object.entries(snapshot.allocations).map(([goalId, amount]) => [
          goalId,
          convert(amount),
        ])
      ),
      unallocatedAmount: convert(snapshot.unallocatedAmount),
    })),
  };
}
