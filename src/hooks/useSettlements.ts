import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import type { Settlement } from '../types';

export function useSettlements(groupId: string | undefined) {
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!groupId) { setSettlements([]); setLoading(false); return; }

    const q = query(collection(db, 'groups', groupId, 'settlements'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q,
      (snapshot) => { setSettlements(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Settlement))); setLoading(false); },
      (err) => { console.error('Error al obtener liquidaciones:', err); setLoading(false); }
    );

    return unsubscribe;
  }, [groupId]);

  return { settlements, loading };
}
