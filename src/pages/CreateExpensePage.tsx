import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useGroup } from '../hooks/useGroups';
import { createExpense } from '../services/expenseService';
import { getExchangeRate } from '../services/currencyService';
import { EXPENSE_CATEGORIES, SUPPORTED_CURRENCIES, type SplitType } from '../types';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';

export function CreateExpensePage() {
  const { id: groupId } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { group, loading: groupLoading } = useGroup(groupId);
  const navigate = useNavigate();

  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('');
  const [paidBy, setPaidBy] = useState('');
  const [category, setCategory] = useState('otros');
  const [splitType, setSplitType] = useState<SplitType>('equal');
  const [splitAmong, setSplitAmong] = useState<string[]>([]);
  const [splitDetails, setSplitDetails] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (group && user) {
      if (!group.memberIds.includes(user.uid)) {
        navigate('/');
        return;
      }
      setCurrency(group.currency);
      setPaidBy(user.uid);
      setSplitAmong(group.memberIds);
    }
  }, [group, user, navigate]);

  const handleSplitAmongToggle = (uid: string) => {
    setSplitAmong((prev) => prev.includes(uid) ? prev.filter((id) => id !== uid) : [...prev, uid]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !group || !groupId) return;

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setError('El monto debe ser mayor que 0');
      return;
    }

    if (splitAmong.length === 0) {
      setError('Selecciona al menos un participante');
      return;
    }

    if (splitType === 'amount') {
      const totalSplit = Object.values(splitDetails).reduce((sum, v) => sum + (parseFloat(v) || 0), 0);
      if (Math.abs(totalSplit - amountNum) > 0.01) {
        setError(`Las cantidades deben sumar ${amountNum.toFixed(2)} (suma actual: ${totalSplit.toFixed(2)})`);
        return;
      }
    }
    if (splitType === 'percentage') {
      const totalPct = Object.values(splitDetails).reduce((sum, v) => sum + (parseFloat(v) || 0), 0);
      if (Math.abs(totalPct - 100) > 0.01) {
        setError(`Los porcentajes deben sumar 100% (suma actual: ${totalPct.toFixed(1)}%)`);
        return;
      }
    }

    setLoading(true);
    setError('');

    try {
      let exchangeRate = 1;
      if (currency !== group.currency) exchangeRate = await getExchangeRate(currency, group.currency);

      const paidByMember = group.members.find((m) => m.uid === paidBy);
      const numericSplitDetails: Record<string, number> = {};
      
      if (splitType !== 'equal') {
        for (const [uid, val] of Object.entries(splitDetails)) {
          numericSplitDetails[uid] = parseFloat(val) || 0;
        }
      }

      await createExpense(groupId, {
        description: description.trim(),
        amount: amountNum,
        currency,
        exchangeRate,
        paidBy,
        paidByName: paidByMember?.displayName || 'Desconocido',
        category,
        splitAmong,
        splitType,
        splitDetails: splitType !== 'equal' ? numericSplitDetails : {},
        createdBy: user.uid,
      });

      navigate(`/group/${groupId}`);
    } catch (err: unknown) {
      const error = err as { message?: string };
      setError(error.message || 'Error al crear el gasto');
      setLoading(false);
    }
  };

  if (groupLoading) return <div className="flex items-center justify-center pt-20"><LoadingSpinner size="lg" /></div>;
  if (!group) return <div className="text-center py-16"><p className="text-text-secondary">Grupo no encontrado</p></div>;

  return (
    <div className="py-6">
      <h1 className="text-2xl font-bold text-text-primary mb-6">Nuevo gasto</h1>

      <div className="bg-bg-secondary border border-border rounded-2xl p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-text-secondary mb-1.5">Descripción</label>
            <input id="description" type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ej: Cena en restaurante" required className="w-full px-4 py-2.5 bg-bg-tertiary border border-border rounded-xl text-text-primary placeholder-text-muted focus:outline-none focus:border-neon-pink focus:ring-1 focus:ring-neon-pink/30 transition-all" />
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label htmlFor="amount" className="block text-sm font-medium text-text-secondary mb-1.5">Monto</label>
              <input id="amount" type="number" step="0.01" min="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" required className="w-full px-4 py-2.5 bg-bg-tertiary border border-border rounded-xl text-text-primary placeholder-text-muted focus:outline-none focus:border-neon-pink focus:ring-1 focus:ring-neon-pink/30 transition-all" />
            </div>
            <div className="w-28">
              <label htmlFor="currency" className="block text-sm font-medium text-text-secondary mb-1.5">Moneda</label>
              <select id="currency" value={currency} onChange={(e) => setCurrency(e.target.value)} className="w-full px-3 py-2.5 bg-bg-tertiary border border-border rounded-xl text-text-primary focus:outline-none focus:border-neon-pink focus:ring-1 focus:ring-neon-pink/30 transition-all appearance-none">
                {SUPPORTED_CURRENCIES.map((c) => <option key={c.code} value={c.code}>{c.symbol} {c.code}</option>)}
              </select>
            </div>
          </div>

          {currency !== group.currency && <p className="text-xs text-[#ffa726] -mt-2">Se convertirá automáticamente a {group.currency}</p>}

          <div>
            <label htmlFor="paidBy" className="block text-sm font-medium text-text-secondary mb-1.5">Pagado por</label>
            <select id="paidBy" value={paidBy} onChange={(e) => setPaidBy(e.target.value)} className="w-full px-4 py-2.5 bg-bg-tertiary border border-border rounded-xl text-text-primary focus:outline-none focus:border-neon-pink focus:ring-1 focus:ring-neon-pink/30 transition-all appearance-none">
              {group.members.map((m) => <option key={m.uid} value={m.uid}>{m.displayName} {m.uid === user?.uid ? '(yo)' : ''}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Categoría</label>
            <div className="grid grid-cols-4 gap-2">
              {EXPENSE_CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                return (
                  <button key={cat.value} type="button" onClick={() => setCategory(cat.value)} className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border transition-all text-xs ${category === cat.value ? 'bg-neon-pink/10 border-neon-pink/40 text-text-primary' : 'bg-bg-tertiary border-border text-text-secondary hover:border-text-muted'}`}>
                    <Icon size={24} className="mb-0.5" />
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Tipo de reparto</label>
            <div className="flex gap-1 p-1 bg-bg-primary rounded-xl">
              {[{ value: 'equal' as SplitType, label: 'Equitativo' }, { value: 'amount' as SplitType, label: 'Por cantidad' }, { value: 'percentage' as SplitType, label: 'Por %' }].map((t) => (
                <button key={t.value} type="button" onClick={() => setSplitType(t.value)} className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all ${splitType === t.value ? 'bg-bg-tertiary text-text-primary shadow-sm' : 'text-text-secondary hover:text-text-primary'}`}>{t.label}</button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Repartir entre</label>
            <div className="space-y-2">
              {group.members.map((m) => (
                <div key={m.uid} className="flex items-center gap-3 p-3 bg-bg-tertiary rounded-xl">
                  <input type="checkbox" checked={splitAmong.includes(m.uid)} onChange={() => handleSplitAmongToggle(m.uid)} className="w-4 h-4 rounded accent-neon-pink" />
                  <span className="flex-1 text-sm text-text-primary">{m.displayName} {m.uid === user?.uid ? '(yo)' : ''}</span>

                  {splitType !== 'equal' && splitAmong.includes(m.uid) && (
                    <div className="flex items-center gap-1">
                      <input type="number" step="0.01" min="0" value={splitDetails[m.uid] || ''} onChange={(e) => setSplitDetails((prev) => ({ ...prev, [m.uid]: e.target.value }))} placeholder="0" className="w-20 px-2 py-1 bg-bg-secondary border border-border rounded-lg text-text-primary text-sm text-right focus:outline-none focus:border-neon-pink transition-all" />
                      <span className="text-xs text-text-secondary">{splitType === 'percentage' ? '%' : currency}</span>
                    </div>
                  )}

                  {splitType === 'equal' && splitAmong.includes(m.uid) && amount && (
                    <span className="text-xs text-text-secondary">{(parseFloat(amount) / splitAmong.length).toFixed(2)} {currency}</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {error && <p className="text-neon-red text-sm">{error}</p>}

          <button type="submit" disabled={loading || !description.trim() || !amount} className="w-full py-3 bg-gradient-to-r from-neon-pink to-neon-pink-light text-white font-semibold rounded-xl hover:shadow-[0_0_20px_rgba(255,45,138,0.4)] transition-all disabled:opacity-50 disabled:cursor-not-allowed">
            {loading ? <LoadingSpinner size="sm" className="justify-center" /> : 'Guardar gasto'}
          </button>
        </form>
      </div>
    </div>
  );
}
