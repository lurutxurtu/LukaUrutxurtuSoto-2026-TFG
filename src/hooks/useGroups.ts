import { useState, useEffect, useCallback } from 'react';
import { collection, doc, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import type { Group } from '../types';

export function useGroups() {
  const { user } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) { setGroups([]); setLoading(false); return; }

    const q = query(
      collection(db, 'groups'),
      where('memberIds', 'array-contains', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q,
      (snapshot) => {
        setGroups(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Group)));
        setLoading(false);
        setError(null);
      },
      (err) => { console.error('Error al obtener grupos:', err); setError('Error al cargar los grupos'); setLoading(false); }
    );

    return unsubscribe;
  }, [user]);

  const refresh = useCallback(() => { setLoading(true); }, []);
  return { groups, loading, error, refresh };
}

export function useGroup(groupId: string | undefined) {
  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!groupId) { setGroup(null); setLoading(false); return; }

    const docRef = doc(db, 'groups', groupId);
    const unsubscribe = onSnapshot(docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          setGroup({ id: docSnap.id, ...docSnap.data() } as Group);
        } else {
          setGroup(null);
          setError('Grupo no encontrado');
        }
        setLoading(false);
      },
      (err) => { console.error('Error al obtener grupo:', err); setError('Error al cargar el grupo'); setLoading(false); }
    );

    return unsubscribe;
  }, [groupId]);

  return { group, loading, error };
}
