import {
  collection, doc, addDoc, getDoc, getDocs, deleteDoc,
  query, orderBy, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { Expense, SplitType } from '../types';

function expensesCollection(groupId: string) {
  return collection(db, 'groups', groupId, 'expenses');
}

export async function createExpense(
  groupId: string,
  data: {
    description: string;
    amount: number;
    currency: string;
    exchangeRate: number;
    paidBy: string;
    paidByName: string;
    category: string;
    splitAmong: string[];
    splitType: SplitType;
    splitDetails?: Record<string, number>;
    createdBy: string;
  }
): Promise<string> {
  const expenseData = { ...data, groupId, createdAt: serverTimestamp() };
  const docRef = await addDoc(expensesCollection(groupId), expenseData);
  return docRef.id;
}

export async function getGroupExpenses(groupId: string): Promise<Expense[]> {
  const q = query(expensesCollection(groupId), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Expense));
}

export async function getExpense(groupId: string, expenseId: string): Promise<Expense | null> {
  const docRef = doc(db, 'groups', groupId, 'expenses', expenseId);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return null;
  return { id: docSnap.id, ...docSnap.data() } as Expense;
}

export async function deleteExpense(groupId: string, expenseId: string): Promise<void> {
  await deleteDoc(doc(db, 'groups', groupId, 'expenses', expenseId));
}
