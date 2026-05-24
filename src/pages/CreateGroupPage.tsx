import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { createGroup } from '../services/groupService';
import { SUPPORTED_CURRENCIES } from '../types';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

export function CreateGroupPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [currency, setCurrency] = useState('EUR');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!name.trim()) {
      setError('El nombre del grupo es obligatorio');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const owner = {
        uid: user.uid,
        displayName: user.displayName || user.email || 'Anónimo',
        photoURL: user.photoURL || null,
      };

      const groupId = await createGroup(name.trim(), currency, owner);
      navigate(`/group/${groupId}`);
    } catch (err: unknown) {
      const error = err as { message?: string };
      setError(error.message || 'Error al crear el grupo');
      setLoading(false);
    }
  };

  return (
    <div className="py-6 max-w-md mx-auto">
      <h1 className="text-2xl font-bold text-text-primary mb-6">Crear nuevo grupo</h1>

      <div className="bg-bg-secondary border border-border rounded-2xl p-6 shadow-xl">
        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            id="name"
            label="Nombre del grupo"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej: Viaje a Madrid"
            autoFocus
          />

          <div>
            <label htmlFor="currency" className="block text-sm font-medium text-text-secondary mb-1.5">
              Moneda principal
            </label>
            <div className="relative">
              <select
                id="currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-4 py-3 bg-bg-tertiary border border-border rounded-xl text-text-primary focus:outline-none focus:border-neon-pink focus:ring-1 focus:ring-neon-pink/30 transition-all appearance-none"
              >
                {SUPPORTED_CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.symbol} - {c.name} ({c.code})
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-text-secondary">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {error && <p className="text-sm text-neon-red">{error}</p>}

          <Button type="submit" disabled={!name.trim()} isLoading={loading} fullWidth className="mt-2">
            Crear grupo
          </Button>
        </form>
      </div>
    </div>
  );
}
