import { useMemo } from 'react';
import type { Expense, Settlement, Balance, DebtDetail, Group } from '../types';
import { calculateBalances, simplifyDebts } from '../utils/balanceCalculator';

export function useBalances(group: Group | null, expenses: Expense[], settlements: Settlement[]) {
  const memberNames = useMemo(() => {
    if (!group) return {};
    const names: Record<string, string> = {};
    for (const member of group.members) names[member.uid] = member.displayName;
    return names;
  }, [group]);

  const balances: Balance[] = useMemo(() => {
    if (!group) return [];
    return calculateBalances(expenses, settlements, memberNames);
  }, [group, expenses, settlements, memberNames]);

  const debts: DebtDetail[] = useMemo(() => {
    if (!group) return [];
    return simplifyDebts(balances, memberNames);
  }, [group, balances, memberNames]);

  const totalExpenses = useMemo(() => {
    return expenses.reduce((sum, exp) => sum + exp.amount * (exp.exchangeRate || 1), 0);
  }, [expenses]);

  return { balances, debts, totalExpenses, memberNames };
}
