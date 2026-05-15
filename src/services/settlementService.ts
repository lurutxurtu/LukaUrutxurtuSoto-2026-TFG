import { collection, addDoc, getDocs, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import type { Settlement } from '../types';

function settlementsCollection(groupId: string) {
  return collection(db, 'groups', groupId, 'settlements');
}

export async function createSettlement(
  groupId: string,
  data: {
    fromUserId: string;
    fromUserName: string;
    toUserId: string;
    toUserName: string;
    amount: number;
    currency: string;
  }
): Promise<string> {
  const settlementData = { ...data, groupId, createdAt: serverTimestamp() };
  const docRef = await addDoc(settlementsCollection(groupId), settlementData);
  return docRef.id;
}

export async function getGroupSettlements(groupId: string): Promise<Settlement[]> {
  const q = query(settlementsCollection(groupId), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Settlement));
}
