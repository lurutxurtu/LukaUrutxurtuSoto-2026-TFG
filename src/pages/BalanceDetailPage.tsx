import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useGroup } from '../hooks/useGroups';
import { useExpenses } from '../hooks/useExpenses';
import { useSettlements } from '../hooks/useSettlements';
import { useBalances } from '../hooks/useBalances';
import { createSettlement } from '../services/settlementService';
import { formatCurrency } from '../utils/formatters';
import { PartyPopper } from 'lucide-react';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { Modal } from '../components/ui/Modal';

export function BalanceDetailPage() {
  const { id: groupId } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { group, loading: groupLoading } = useGroup(groupId);
  const { expenses, loading: expensesLoading } = useExpenses(groupId);
  const { settlements } = useSettlements(groupId);
  const { balances, debts } = useBalances(group, expenses, settlements);
  const navigate = useNavigate();

  const [showSettleModal, setShowSettleModal] = useState(false);
  const [settleTarget, setSettleTarget] = useState<{ userId: string; name: string; amount: number; direction: 'paying' | 'receiving' } | null>(null);
  const [settleAmount, setSettleAmount] = useState('');
  const [settleLoading, setSettleLoading] = useState(false);

  useEffect(() => {
    if (group && user && !group.memberIds.includes(user.uid)) {
      navigate('/');
    }
  }, [group, user, navigate]);

  const loading = groupLoading || expensesLoading;
  const myBalance = balances.find((b) => b.userId === user?.uid);
  const myDebtsOwed = debts.filter((d) => d.fromUserId === user?.uid);
  const myDebtsReceivable = debts.filter((d) => d.toUserId === user?.uid);

  const handleSettle = async () => {
    if (!user || !group || !groupId || !settleTarget) return;

    const amount = parseFloat(settleAmount);
    if (isNaN(amount) || amount <= 0) return;

    setSettleLoading(true);
    try {
      await createSettlement(groupId, {
        fromUserId: settleTarget.direction === 'paying' ? user.uid : settleTarget.userId,
        fromUserName: settleTarget.direction === 'paying' ? (user.displayName || user.email || 'Yo') : settleTarget.name,
        toUserId: settleTarget.direction === 'paying' ? settleTarget.userId : user.uid,
        toUserName: settleTarget.direction === 'paying' ? settleTarget.name : (user.displayName || user.email || 'Yo'),
        amount,
        currency: group.currency,
      });

      setShowSettleModal(false);
      setSettleTarget(null);
      setSettleAmount('');
    } catch (err) {
      console.error('Error al registrar pago:', err);
    } finally {
      setSettleLoading(false);
    }
  };

  const openSettleModal = (userId: string, name: string, amount: number, direction: 'paying' | 'receiving') => {
    setSettleTarget({ userId, name, amount, direction });
    setSettleAmount(amount.toFixed(2));
    setShowSettleModal(true);
  };

  if (loading) return <div className="flex items-center justify-center pt-20"><LoadingSpinner size="lg" /></div>;
  if (!group) return <div className="text-center py-16"><p className="text-text-secondary">Grupo no encontrado</p></div>;

  return (
    <div className="py-6">
      <h1 className="text-2xl font-bold text-text-primary mb-6">Mi balance</h1>

      <div className={`p-5 rounded-2xl border mb-6 text-center ${(myBalance?.amount ?? 0) > 0.01 ? 'bg-neon-green/5 border-neon-green/20' : (myBalance?.amount ?? 0) < -0.01 ? 'bg-neon-pink/5 border-neon-pink/20' : 'bg-bg-secondary border-border'}`}>
        <p className="text-sm text-text-secondary mb-2">Balance total</p>
        <p className={`text-3xl font-bold ${(myBalance?.amount ?? 0) > 0.01 ? 'text-neon-green' : (myBalance?.amount ?? 0) < -0.01 ? 'text-neon-pink' : 'text-text-primary'}`}>
          {(myBalance?.amount ?? 0) > 0 ? '+' : ''}{formatCurrency(myBalance?.amount ?? 0, group.currency)}
        </p>
        <p className="text-xs text-text-secondary mt-2">
          {(myBalance?.amount ?? 0) > 0.01 ? 'En total te deben esta cantidad' : (myBalance?.amount ?? 0) < -0.01 ? 'En total debes esta cantidad' : '¡Estás en paz!'}
        </p>
      </div>

      {myDebtsOwed.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-medium text-neon-pink mb-3 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" /></svg>
            Debo a
          </h3>
          <div className="space-y-2">
            {myDebtsOwed.map((debt, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-bg-secondary border border-border rounded-xl">
                <div>
                  <p className="font-medium text-text-primary text-sm">{debt.toUserName}</p>
                  <p className="text-xs text-text-secondary mt-0.5">Debes {formatCurrency(debt.amount, group.currency)}</p>
                </div>
                <button onClick={() => openSettleModal(debt.toUserId, debt.toUserName, debt.amount, 'paying')} className="px-4 py-2 text-xs font-medium bg-neon-green/10 border border-neon-green/30 text-neon-green rounded-xl hover:bg-neon-green/20 transition-all">Liquidar</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {myDebtsReceivable.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-medium text-neon-green mb-3 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 4.5l-15 15m0 0h11.25m-11.25 0V8.25" /></svg>
            Me deben
          </h3>
          <div className="space-y-2">
            {myDebtsReceivable.map((debt, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-bg-secondary border border-border rounded-xl">
                <div>
                  <p className="font-medium text-text-primary text-sm">{debt.fromUserName}</p>
                  <p className="text-xs text-text-secondary mt-0.5">Te debe {formatCurrency(debt.amount, group.currency)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-neon-green">+{formatCurrency(debt.amount, group.currency)}</span>
                  <button onClick={() => openSettleModal(debt.fromUserId, debt.fromUserName, debt.amount, 'receiving')} className="px-3 py-1.5 text-xs font-medium bg-bg-tertiary border border-border text-text-primary rounded-xl hover:bg-border transition-all">Cobrar</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {myDebtsOwed.length === 0 && myDebtsReceivable.length === 0 && (
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-bg-secondary border border-border flex items-center justify-center text-text-secondary">
            <PartyPopper className="w-8 h-8" />
          </div>
          <p className="text-text-secondary text-sm">No tienes deudas pendientes</p>
        </div>
      )}

      <button onClick={() => navigate(`/group/${groupId}`)} className="w-full py-3 mt-4 bg-bg-tertiary border border-border text-text-primary font-medium rounded-xl hover:bg-border transition-colors text-sm">Volver al grupo</button>

      <Modal isOpen={showSettleModal} onClose={() => { setShowSettleModal(false); setSettleTarget(null); }} title="Registrar pago">
        {settleTarget && (
          <div className="space-y-4">
            <p className="text-sm text-text-secondary">
              {settleTarget.direction === 'paying' ? 'Registrar un pago a ' : 'Registrar un cobro de '}
              <span className="text-text-primary font-medium">{settleTarget.name}</span>
            </p>
            <div>
              <label htmlFor="settleAmount" className="block text-sm font-medium text-text-secondary mb-1.5">Cantidad ({group.currency})</label>
              <input id="settleAmount" type="number" step="0.01" min="0.01" value={settleAmount} onChange={(e) => setSettleAmount(e.target.value)} className="w-full px-4 py-2.5 bg-bg-tertiary border border-border rounded-xl text-text-primary focus:outline-none focus:border-neon-pink focus:ring-1 focus:ring-neon-pink/30 transition-all" />
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setShowSettleModal(false); setSettleTarget(null); }} className="flex-1 py-2.5 bg-bg-tertiary border border-border text-text-primary rounded-xl hover:bg-border transition-colors text-sm font-medium">Cancelar</button>
              <button onClick={handleSettle} disabled={settleLoading} className="flex-1 py-2.5 bg-gradient-to-r from-neon-green to-[#32cd32] text-bg-primary font-semibold rounded-xl hover:shadow-[0_0_15px_rgba(57,255,20,0.3)] transition-all disabled:opacity-50 text-sm">
                {settleLoading ? <LoadingSpinner size="sm" className="justify-center" /> : (settleTarget.direction === 'paying' ? 'Confirmar pago' : 'Confirmar cobro')}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
