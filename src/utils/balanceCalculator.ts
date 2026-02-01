import type { Expense, Settlement, Balance, DebtDetail } from '../types';

export function calculateBalances(
  expenses: Expense[],
  settlements: Settlement[],
  memberNames: Record<string, string>
): Balance[] {
  const balanceMap: Record<string, number> = {};

  for (const uid of Object.keys(memberNames)) {
    balanceMap[uid] = 0;
  }

  for (const expense of expenses) {
    const { paidBy, amount, splitAmong, splitType, splitDetails, exchangeRate } = expense;
    const convertedAmount = amount * (exchangeRate || 1);

    balanceMap[paidBy] = (balanceMap[paidBy] || 0) + convertedAmount;

    if (splitType === 'equal') {
      const perPerson = convertedAmount / splitAmong.length;
      for (const uid of splitAmong) {
        balanceMap[uid] = (balanceMap[uid] || 0) - perPerson;
      }
    } else if (splitType === 'amount' && splitDetails) {
      for (const [uid, share] of Object.entries(splitDetails)) {
        const convertedShare = share * (exchangeRate || 1);
        balanceMap[uid] = (balanceMap[uid] || 0) - convertedShare;
      }
    } else if (splitType === 'percentage' && splitDetails) {
      for (const [uid, pct] of Object.entries(splitDetails)) {
        const share = (convertedAmount * pct) / 100;
        balanceMap[uid] = (balanceMap[uid] || 0) - share;
      }
    }
  }

  for (const settlement of settlements) {
    const convertedAmount = settlement.amount;
    balanceMap[settlement.fromUserId] = (balanceMap[settlement.fromUserId] || 0) + convertedAmount;
    balanceMap[settlement.toUserId] = (balanceMap[settlement.toUserId] || 0) - convertedAmount;
  }

  return Object.entries(balanceMap).map(([userId, amount]) => ({
    userId,
    displayName: memberNames[userId] || 'Desconocido',
    amount: Math.round(amount * 100) / 100,
  }));
}

export function simplifyDebts(
  balances: Balance[],
  memberNames: Record<string, string>
): DebtDetail[] {
  const debtors: { userId: string; amount: number }[] = [];
  const creditors: { userId: string; amount: number }[] = [];

  for (const balance of balances) {
    if (balance.amount < -0.01) {
      debtors.push({ userId: balance.userId, amount: Math.abs(balance.amount) });
    } else if (balance.amount > 0.01) {
      creditors.push({ userId: balance.userId, amount: balance.amount });
    }
  }

  debtors.sort((a, b) => b.amount - a.amount);
  creditors.sort((a, b) => b.amount - a.amount);

  const debts: DebtDetail[] = [];
  let i = 0;
  let j = 0;

  while (i < debtors.length && j < creditors.length) {
    const transfer = Math.min(debtors[i].amount, creditors[j].amount);

    if (transfer > 0.01) {
      debts.push({
        fromUserId: debtors[i].userId,
        fromUserName: memberNames[debtors[i].userId] || 'Desconocido',
        toUserId: creditors[j].userId,
        toUserName: memberNames[creditors[j].userId] || 'Desconocido',
        amount: Math.round(transfer * 100) / 100,
      });
    }

    debtors[i].amount -= transfer;
    creditors[j].amount -= transfer;

    if (debtors[i].amount < 0.01) i++;
    if (creditors[j].amount < 0.01) j++;
  }

  return debts;
}
