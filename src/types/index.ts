import type { Timestamp } from 'firebase/firestore';
import { Utensils, Car, Home, Gamepad2, ShoppingCart, Lightbulb, Package, type LucideIcon } from 'lucide-react';

export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string | null;
  createdAt: Timestamp;
}

export interface Group {
  id: string;
  name: string;
  currency: string;
  ownerId: string;
  memberIds: string[];
  members: GroupMember[];
  joinCode: string;
  createdAt: Timestamp;
}

export interface GroupMember {
  uid: string;
  displayName: string;
  photoURL: string | null;
}

export interface Expense {
  id: string;
  groupId: string;
  description: string;
  amount: number;
  currency: string;
  exchangeRate: number;
  paidBy: string;
  paidByName: string;
  category: ExpenseCategory;
  splitAmong: string[];
  splitType: SplitType;
  splitDetails?: Record<string, number>;
  createdBy: string;
  createdAt: Timestamp;
}

export type SplitType = 'equal' | 'amount' | 'percentage';

export type ExpenseCategory =
  | 'comida'
  | 'transporte'
  | 'alojamiento'
  | 'ocio'
  | 'compras'
  | 'servicios'
  | 'otros';

export const EXPENSE_CATEGORIES: { value: ExpenseCategory; label: string; icon: LucideIcon }[] = [
  { value: 'comida', label: 'Comida', icon: Utensils },
  { value: 'transporte', label: 'Transporte', icon: Car },
  { value: 'alojamiento', label: 'Alojamiento', icon: Home },
  { value: 'ocio', label: 'Ocio', icon: Gamepad2 },
  { value: 'compras', label: 'Compras', icon: ShoppingCart },
  { value: 'servicios', label: 'Servicios', icon: Lightbulb },
  { value: 'otros', label: 'Otros', icon: Package },
];

export interface Settlement {
  id: string;
  groupId: string;
  fromUserId: string;
  fromUserName: string;
  toUserId: string;
  toUserName: string;
  amount: number;
  currency: string;
  createdAt: Timestamp;
}

export interface Balance {
  userId: string;
  displayName: string;
  amount: number;
}

export interface DebtDetail {
  fromUserId: string;
  fromUserName: string;
  toUserId: string;
  toUserName: string;
  amount: number;
}

export interface Currency {
  code: string;
  name: string;
  symbol: string;
}

export const SUPPORTED_CURRENCIES: Currency[] = [
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'USD', name: 'Dólar estadounidense', symbol: '$' },
  { code: 'GBP', name: 'Libra esterlina', symbol: '£' },
  { code: 'JPY', name: 'Yen japonés', symbol: '¥' },
  { code: 'CHF', name: 'Franco suizo', symbol: 'Fr' },
  { code: 'CAD', name: 'Dólar canadiense', symbol: 'C$' },
  { code: 'AUD', name: 'Dólar australiano', symbol: 'A$' },
  { code: 'MXN', name: 'Peso mexicano', symbol: 'Mex$' },
  { code: 'BRL', name: 'Real brasileño', symbol: 'R$' },
  { code: 'ARS', name: 'Peso argentino', symbol: 'AR$' },
  { code: 'CLP', name: 'Peso chileno', symbol: 'CLP$' },
  { code: 'COP', name: 'Peso colombiano', symbol: 'COL$' },
];
