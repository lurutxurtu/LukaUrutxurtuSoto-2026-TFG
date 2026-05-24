import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useGroups } from '../hooks/useGroups';
import { joinGroupByCode } from '../services/groupService';
import { timeAgo } from '../utils/formatters';
import { Modal } from '../components/ui/Modal';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import type { GroupMember } from '../types';

export function HomePage() {
  const { user } = useAuth();
  const { groups, loading, error, refresh } = useGroups();
  const navigate = useNavigate();

  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [joinError, setJoinError] = useState('');
  const [joining, setJoining] = useState(false);

  const handleJoinGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !joinCode.trim()) return;

    setJoining(true);
    setJoinError('');

    try {
      const member: GroupMember = {
        uid: user.uid,
        displayName: user.displayName || user.email || 'Anónimo',
        photoURL: user.photoURL || null,
      };

      const groupId = await joinGroupByCode(joinCode.trim(), member);
      setShowJoinModal(false);
      navigate(`/group/${groupId}`);
    } catch (err: unknown) {
      const error = err as { message?: string };
      setJoinError(error.message || 'Código no válido');
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center pt-20">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="py-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Mis grupos</h1>
          <p className="text-sm text-text-secondary mt-1">
            Hola, {user?.displayName?.split(' ')[0] || 'usuario'}
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-neon-red/10 border border-neon-red/20 rounded-xl flex items-center justify-between">
          <p className="text-sm text-neon-red">{error}</p>
          <button onClick={refresh} className="text-xs font-medium text-neon-red hover:underline">Reintentar</button>
        </div>
      )}

      <div className="grid gap-3 mb-8">
        {groups.map((group) => (
          <button
            key={group.id}
            onClick={() => navigate(`/group/${group.id}`)}
            className="w-full text-left p-4 bg-bg-secondary border border-border rounded-2xl hover:border-neon-pink/50 transition-all group flex items-center justify-between animate-slide-up"
          >
            <div>
              <h3 className="font-semibold text-text-primary group-hover:text-neon-pink transition-colors">
                {group.name}
              </h3>
              <p className="text-xs text-text-secondary mt-1 flex items-center gap-2">
                <span>{group.memberIds.length} miembros</span>
                <span className="w-1 h-1 bg-text-muted rounded-full" />
                <span>{timeAgo(group.createdAt)}</span>
              </p>
            </div>
            <div className="w-10 h-10 rounded-full bg-bg-tertiary flex items-center justify-center text-text-muted group-hover:text-neon-pink transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>
        ))}

        {groups.length === 0 && !error && (
          <div className="text-center py-12 px-4 border border-dashed border-border rounded-2xl bg-bg-secondary/50">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-bg-tertiary flex items-center justify-center">
              <svg className="w-8 h-8 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-text-primary mb-1">Aún no tienes grupos</h3>
            <p className="text-sm text-text-secondary">Crea un grupo nuevo o únete a uno existente para empezar a dividir gastos.</p>
          </div>
        )}
      </div>

      <div className="sticky bottom-[76px] z-20 flex gap-3 pt-3 pb-2 bg-bg-primary/90 backdrop-blur-md shadow-[0_-20px_20px_-15px_rgba(15,23,42,0.8)] before:absolute before:-top-6 before:left-0 before:right-0 before:h-6 before:bg-gradient-to-t before:from-bg-primary/90 before:to-transparent">
        <Button onClick={() => navigate('/create-group')} className="flex-1">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Crear grupo
        </Button>
        <Button variant="secondary" onClick={() => setShowJoinModal(true)} className="flex-1 hover:border-neon-green/50 hover:text-neon-green">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
          </svg>
          Unirse a grupo
        </Button>
      </div>

      <Modal isOpen={showJoinModal} onClose={() => setShowJoinModal(false)} title="Unirse a un grupo">
        <form onSubmit={handleJoinGroup} className="space-y-4">
          <Input
            id="joinCode"
            label="Código de invitación"
            required
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            placeholder="Ej: A1B2C3"
            className="font-mono uppercase tracking-wider focus:border-neon-green focus:ring-neon-green/30"
            error={joinError}
          />
          <Button type="submit" variant="success" fullWidth disabled={joining || !joinCode} isLoading={joining}>
            {joining ? 'Buscando...' : 'Unirse al grupo'}
          </Button>
        </form>
      </Modal>
    </div>
  );
}
