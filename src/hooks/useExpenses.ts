import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import type { Expense } from '../types';

export function useExpenses(groupId: string | undefined) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!groupId) { setExpenses([]); setLoading(false); return; }

    const q = query(collection(db, 'groups', groupId, 'expenses'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q,
      (snapshot) => {
        setExpenses(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Expense)));
        setLoading(false);
        setError(null);
      },
      (err) => { console.error('Error al obtener gastos:', err); setError('Error al cargar los gastos'); setLoading(false); }
    );

    return unsubscribe;
  }, [groupId]);

  return { expenses, loading, error };
}
