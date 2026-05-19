import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useGroup } from '../hooks/useGroups';
import { leaveGroup, removeMemberFromGroup, updateGroupName } from '../services/groupService';
import { useExpenses } from '../hooks/useExpenses';
import { useSettlements } from '../hooks/useSettlements';
import { useBalances } from '../hooks/useBalances';
import { formatCurrency, formatDate, getInitials } from '../utils/formatters';
import { EXPENSE_CATEGORIES } from '../types';
import { Package, Receipt } from 'lucide-react';
import { EditableTitle } from '../components/ui/EditableTitle';
import { Modal } from '../components/ui/Modal';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

type Tab = 'expenses' | 'balance';

const CHART_COLORS = ['#ff2d8a', '#39ff14', '#ff6eb4', '#00d4ff', '#ffa726', '#ab47bc', '#26a69a'];

export function GroupDetailPage() {
  const { id: groupId } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { group, loading: groupLoading } = useGroup(groupId);
  const { expenses, loading: expensesLoading } = useExpenses(groupId);
  const { settlements } = useSettlements(groupId);
  const { balances, debts, totalExpenses } = useBalances(group, expenses, settlements);
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<Tab>('expenses');
  const [copied, setCopied] = useState(false);



  useEffect(() => {
    if (group && user && !group.memberIds.includes(user.uid)) {
      navigate('/');
    }
  }, [group, user, navigate]);
  
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [leaveError, setLeaveError] = useState('');
  const [leaving, setLeaving] = useState(false);

  const [showExpelModal, setShowExpelModal] = useState(false);
  const [expelTarget, setExpelTarget] = useState<{ id: string; name: string } | null>(null);
  const [expelError, setExpelError] = useState('');
  const [expelling, setExpelling] = useState(false);

  const loading = groupLoading || expensesLoading;

  const copyJoinCode = async () => {
    if (!group) return;
    try {
      await navigator.clipboard.writeText(group.joinCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleLeave = async () => {
    if (!groupId || !user || !myBalance) return;
    if (Math.abs(myBalance.amount) > 0.01) {
      setLeaveError('No puedes abandonar el grupo si tienes deudas pendientes o te deben dinero.');
      return;
    }
    
    setLeaving(true);
    setLeaveError('');
    try {
      await leaveGroup(groupId, user.uid);
      navigate('/');
    } catch (err: unknown) {
      setLeaveError(err instanceof Error ? err.message : 'Error al abandonar el grupo');
      setLeaving(false);
    }
  };

  const handleExpel = async () => {
    if (!groupId || !user || !expelTarget) return;
    setExpelling(true);
    setExpelError('');
    try {
      await removeMemberFromGroup(groupId, user.uid, expelTarget.id);
      setShowExpelModal(false);
      setExpelTarget(null);
    } catch (err: unknown) {
      setExpelError(err instanceof Error ? err.message : 'Error al expulsar integrante');
    } finally {
      setExpelling(false);
    }
  };

  const categoryData = EXPENSE_CATEGORIES.map((cat) => {
    const total = expenses
      .filter((e) => e.category === cat.value)
      .reduce((sum, e) => sum + e.amount * (e.exchangeRate || 1), 0);
    return { name: cat.label, value: Math.round(total * 100) / 100, icon: cat.icon };
  }).filter((d) => d.value > 0);

  const personData = balances.map((b) => ({
    name: b.displayName.split(' ')[0],
    pagado: expenses
      .filter((e) => e.paidBy === b.userId)
      .reduce((sum, e) => sum + e.amount * (e.exchangeRate || 1), 0),
  }));

  const myBalance = balances.find((b) => b.userId === user?.uid);

  if (loading) return <div className="flex items-center justify-center pt-20"><LoadingSpinner size="lg" /></div>;

  if (!group) {
    return (
      <div className="text-center py-16">
        <h2 className="text-lg font-medium text-text-primary mb-2">Grupo no encontrado</h2>
        <button onClick={() => navigate('/')} className="text-neon-pink hover:text-neon-pink-light text-sm transition-colors">Volver a inicio</button>
      </div>
    );
  }

  return (
    <div className="py-6">
      <div className="mb-6">
        <EditableTitle 
          initialName={group.name} 
          onSave={async (name) => {
            if (group) await updateGroupName(group.id, name);
          }} 
          canEdit={group.ownerId === user?.uid} 
        />
        <button onClick={copyJoinCode} className="inline-flex items-center gap-2 px-3 py-1.5 bg-bg-secondary border border-border rounded-xl text-sm hover:border-neon-green/50 transition-all">
          <span className="text-text-secondary">Código:</span>
          <span className="font-mono font-semibold text-neon-green tracking-wider">{group.joinCode}</span>
          {copied ? (
            <svg className="w-4 h-4 text-neon-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
          ) : (
            <svg className="w-4 h-4 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" /></svg>
          )}
        </button>

        <div className="flex gap-3 mt-4">
          <div className="flex-1 p-3 bg-bg-secondary border border-border rounded-xl text-center">
            <p className="text-xs text-text-secondary mb-1">Total gastos</p>
            <p className="text-lg font-bold text-text-primary">{formatCurrency(totalExpenses, group.currency)}</p>
          </div>
          <div className="flex-1 p-3 bg-bg-secondary border border-border rounded-xl text-center">
            <p className="text-xs text-text-secondary mb-1">Miembros</p>
            <p className="text-lg font-bold text-text-primary">{group.memberIds.length}</p>
          </div>
        </div>
      </div>

      <div className="sticky top-14 z-30 pt-2 pb-4 bg-bg-primary/90 backdrop-blur-xl -mx-4 px-4 shadow-[0_10px_15px_-15px_rgba(0,0,0,0.5)]">
        <div className="flex gap-1 p-1 bg-bg-secondary rounded-xl shadow-sm">
          <button onClick={() => setActiveTab('expenses')} className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${activeTab === 'expenses' ? 'bg-bg-tertiary text-text-primary shadow-sm' : 'text-text-secondary hover:text-text-primary'}`}>Gastos ({expenses.length})</button>
          <button onClick={() => setActiveTab('balance')} className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${activeTab === 'balance' ? 'bg-bg-tertiary text-text-primary shadow-sm' : 'text-text-secondary hover:text-text-primary'}`}>Balance</button>
        </div>
      </div>

      {activeTab === 'expenses' ? (
        <div>
          <button onClick={() => navigate(`/group/${groupId}/expense`)} className="w-full mb-4 py-3 bg-gradient-to-r from-neon-pink to-neon-pink-light text-white font-semibold rounded-xl hover:shadow-[0_0_20px_rgba(255,45,138,0.4)] transition-all flex items-center justify-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
            Añadir gasto
          </button>

          {expenses.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-bg-secondary border border-border flex items-center justify-center">
                <Receipt className="w-8 h-8 text-text-secondary" strokeWidth={1.5} />
              </div>
              <p className="text-text-secondary text-sm">No hay gastos todavía</p>
              <p className="text-text-muted text-xs mt-1">Añade el primer gasto del grupo</p>
            </div>
          ) : (
            <div className="space-y-2">
              {expenses.map((expense) => {
                const category = EXPENSE_CATEGORIES.find((c) => c.value === expense.category);
                const Icon = category?.icon || Package;
                return (
                  <button key={expense.id} onClick={() => navigate(`/group/${groupId}/expense/${expense.id}`)} className="w-full p-4 bg-bg-secondary border border-border rounded-xl text-left hover:border-neon-pink/30 transition-all flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-bg-tertiary flex items-center justify-center text-text-secondary flex-shrink-0">
                      <Icon size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-text-primary text-sm truncate">{expense.description}</p>
                      <p className="text-xs text-text-secondary mt-0.5">Pagado por {expense.paidByName} · {formatDate(expense.createdAt)}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-semibold text-text-primary text-sm">{formatCurrency(expense.amount, expense.currency)}</p>
                      <p className="text-xs text-text-secondary">÷{expense.splitAmong.length}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {myBalance && (
            <button onClick={() => navigate(`/group/${groupId}/balance`)} className={`w-full p-4 rounded-2xl border text-left transition-all ${myBalance.amount > 0.01 ? 'bg-neon-green/5 border-neon-green/20 hover:border-neon-green/40' : myBalance.amount < -0.01 ? 'bg-neon-pink/5 border-neon-pink/20 hover:border-neon-pink/40' : 'bg-bg-secondary border-border hover:border-text-muted'}`}>
              <p className="text-xs text-text-secondary mb-1">Mi balance</p>
              <p className={`text-2xl font-bold ${myBalance.amount > 0.01 ? 'text-neon-green' : myBalance.amount < -0.01 ? 'text-neon-pink' : 'text-text-primary'}`}>
                {myBalance.amount > 0 ? '+' : ''}{formatCurrency(myBalance.amount, group.currency)}
              </p>
              <p className="text-xs text-text-secondary mt-1">{myBalance.amount > 0.01 ? 'Te deben dinero' : myBalance.amount < -0.01 ? 'Debes dinero' : 'Estás en paz '}</p>
              <div className="flex items-center gap-1 mt-2 text-xs text-text-muted">
                <span>Ver detalles</span>
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
              </div>
            </button>
          )}

          <div>
            <h3 className="text-sm font-medium text-text-secondary mb-3">Balances del grupo</h3>
            <div className="space-y-2">
              {balances.map((balance) => (
                <div key={balance.userId} className="flex items-center justify-between p-3 bg-bg-secondary border border-border rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-bg-tertiary flex items-center justify-center text-xs font-semibold text-text-primary">{getInitials(balance.displayName)}</div>
                    <span className="text-sm text-text-primary">
                      {balance.displayName} {user?.uid === balance.userId && <span className="text-text-muted font-normal text-xs ml-1">(Tú)</span>}
                      {group.ownerId === balance.userId && <span className="ml-2 text-[10px] font-bold tracking-wider text-neon-pink bg-neon-pink/10 px-2 py-0.5 rounded-full uppercase">Admin</span>}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-sm font-semibold ${balance.amount > 0.01 ? 'text-neon-green' : balance.amount < -0.01 ? 'text-neon-pink' : 'text-text-secondary'}`}>
                      {balance.amount > 0 ? '+' : ''}{formatCurrency(balance.amount, group.currency)}
                    </span>
                    {user?.uid === group.ownerId && balance.userId !== user.uid && (
                      <button 
                        onClick={() => {
                          if (Math.abs(balance.amount) > 0.01) {
                            alert('No puedes echar a un integrante que tenga deudas pendientes. Primero salda las cuentas.');
                            return;
                          }
                          setExpelTarget({ id: balance.userId, name: balance.displayName });
                          setShowExpelModal(true);
                          setExpelError('');
                        }}
                        className="p-1.5 text-text-muted hover:text-neon-red hover:bg-neon-red/10 rounded-lg transition-colors"
                        title="Echar del grupo"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {debts.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-text-secondary mb-3">Transferencias pendientes</h3>
              <div className="space-y-2">
                {debts.map((debt, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-bg-secondary border border-border rounded-xl">
                    <div className="flex-1 flex items-center gap-2 text-sm">
                      <span className="text-neon-pink font-medium">{debt.fromUserName.split(' ')[0]}</span>
                      <svg className="w-4 h-4 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
                      <span className="text-neon-green font-medium">{debt.toUserName.split(' ')[0]}</span>
                    </div>
                    <span className="text-sm font-bold text-text-primary">{formatCurrency(debt.amount, group.currency)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {categoryData.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-text-secondary mb-3">Gastos por categoría</h3>
              <div className="bg-bg-secondary border border-border rounded-2xl p-4">
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={categoryData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                      {categoryData.map((_entry, index) => <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border)', borderRadius: '12px', color: 'var(--color-text-primary)', fontSize: '12px' }} formatter={(value) => formatCurrency(Number(value), group.currency)} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap gap-3 justify-center mt-2">
                  {categoryData.map((d, i) => {
                    const Icon = d.icon;
                    return (
                      <div key={d.name} className="flex items-center gap-1.5 text-xs text-text-secondary">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                        <Icon size={14} /> {d.name}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {personData.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-text-secondary mb-3">Pagado por persona</h3>
              <div className="bg-bg-secondary border border-border rounded-2xl p-4">
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={personData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                    <XAxis dataKey="name" tick={{ fill: 'var(--color-text-secondary)', fontSize: 12 }} axisLine={false} />
                    <YAxis tick={{ fill: 'var(--color-text-secondary)', fontSize: 12 }} axisLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border)', borderRadius: '12px', color: 'var(--color-text-primary)', fontSize: '12px' }} formatter={(value) => formatCurrency(Number(value), group.currency)} />
                    <Bar dataKey="pagado" fill="var(--color-neon-pink)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="sticky bottom-[76px] md:bottom-8 z-20 mt-8 pt-4 pb-2 bg-bg-primary/90 backdrop-blur-md shadow-[0_-20px_20px_-15px_rgba(15,23,42,0.8)] before:absolute before:-top-6 before:left-0 before:right-0 before:h-6 before:bg-gradient-to-t before:from-bg-primary/90 before:to-transparent">
        <button onClick={() => setShowLeaveModal(true)} className="w-full py-3.5 bg-neon-red/10 border border-neon-red/30 text-neon-red font-semibold rounded-xl hover:bg-neon-red/20 transition-colors shadow-sm">
          Abandonar grupo
        </button>
      </div>

      <Modal isOpen={showLeaveModal} onClose={() => setShowLeaveModal(false)} title="Abandonar grupo">
        <p className="text-sm text-text-secondary mb-5">
          ¿Estás seguro de que quieres abandonar este grupo? Dejarás de tener acceso a los gastos compartidos.
        </p>
        
        {Math.abs(myBalance?.amount || 0) > 0.01 && (
          <div className="mb-4 p-3 bg-neon-pink/10 border border-neon-pink/30 rounded-lg text-neon-pink text-xs">
            Tienes un balance de {formatCurrency(myBalance?.amount || 0, group?.currency || '')}. Debes saldar tus cuentas antes de salir.
          </div>
        )}

        {leaveError && (
          <div className="mb-4 p-3 bg-neon-red/10 border border-neon-red/30 rounded-lg text-neon-red text-xs">
            {leaveError}
          </div>
        )}

        <div className="flex gap-3">
          <button onClick={() => setShowLeaveModal(false)} className="flex-1 py-2.5 bg-bg-tertiary border border-border text-text-primary rounded-xl hover:bg-border transition-colors text-sm font-medium">
            Cancelar
          </button>
          <button onClick={handleLeave} disabled={leaving || Math.abs(myBalance?.amount || 0) > 0.01} className="flex-1 py-2.5 bg-neon-red/20 border border-neon-red/30 text-neon-red rounded-xl hover:bg-neon-red/30 transition-colors text-sm font-medium disabled:opacity-50">
            {leaving ? <LoadingSpinner size="sm" className="justify-center" /> : 'Abandonar'}
          </button>
        </div>
      </Modal>

      <Modal isOpen={showExpelModal} onClose={() => setShowExpelModal(false)} title="Expulsar integrante">
        <p className="text-sm text-text-secondary mb-5">
          ¿Estás seguro de que quieres echar a <strong className="text-text-primary">{expelTarget?.name}</strong> del grupo? 
          Ya no podrá ver los gastos ni participar.
        </p>

        {expelError && (
          <div className="mb-4 p-3 bg-neon-red/10 border border-neon-red/30 rounded-lg text-neon-red text-xs">
            {expelError}
          </div>
        )}

        <div className="flex gap-3">
          <button onClick={() => setShowExpelModal(false)} className="flex-1 py-2.5 bg-bg-tertiary border border-border text-text-primary rounded-xl hover:bg-border transition-colors text-sm font-medium">
            Cancelar
          </button>
          <button onClick={handleExpel} disabled={expelling} className="flex-1 py-2.5 bg-neon-red/20 border border-neon-red/30 text-neon-red rounded-xl hover:bg-neon-red/30 transition-colors text-sm font-medium disabled:opacity-50">
            {expelling ? <LoadingSpinner size="sm" className="justify-center" /> : 'Expulsar'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
