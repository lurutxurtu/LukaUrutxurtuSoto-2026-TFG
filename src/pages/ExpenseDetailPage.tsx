import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useGroup } from '../hooks/useGroups';
import { getExpense, deleteExpense } from '../services/expenseService';
import { formatCurrency, formatDateTime } from '../utils/formatters';
import { EXPENSE_CATEGORIES, type Expense } from '../types';
import { Package } from 'lucide-react';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { Modal } from '../components/ui/Modal';

export function ExpenseDetailPage() {
  const { id: groupId, expenseId } = useParams<{ id: string; expenseId: string }>();
  const { user } = useAuth();
  const { group } = useGroup(groupId);
  const navigate = useNavigate();

  const [expense, setExpense] = useState<Expense | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!groupId || !expenseId) return;

    getExpense(groupId, expenseId).then((exp) => {
      setExpense(exp);
      setLoading(false);
    });
  }, [groupId, expenseId]);

  useEffect(() => {
    if (group && user && !group.memberIds.includes(user.uid)) {
      navigate('/');
    }
  }, [group, user, navigate]);

  const handleDelete = async () => {
    if (!groupId || !expenseId) return;
    setDeleting(true);
    try {
      await deleteExpense(groupId, expenseId);
      navigate(`/group/${groupId}`);
    } catch {
      setDeleting(false);
    }
  };

  const canDelete = user && expense && group && (expense.createdBy === user.uid || group.ownerId === user.uid);

  if (loading) return <div className="flex items-center justify-center pt-20"><LoadingSpinner size="lg" /></div>;
  if (!expense || !group) return <div className="text-center py-16"><p className="text-text-secondary">Gasto no encontrado</p></div>;

  const category = EXPENSE_CATEGORIES.find((c) => c.value === expense.category);
  const Icon = category?.icon || Package;
  const perPerson = expense.splitType === 'equal' ? expense.amount / expense.splitAmong.length : 0;

  return (
    <div className="py-6">
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-bg-tertiary flex items-center justify-center text-text-primary">
              <Icon size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-text-primary">{expense.description}</h1>
              <p className="text-sm text-text-secondary">{category?.label || 'Otros'}</p>
            </div>
          </div>
        </div>

        {canDelete && (
          <button onClick={() => setShowDeleteModal(true)} className="p-2 rounded-lg text-neon-red hover:bg-neon-red/10 transition-colors" aria-label="Eliminar gasto">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
          </button>
        )}
      </div>

      <div className="bg-bg-secondary border border-border rounded-2xl p-5 mb-4 text-center">
        <p className="text-3xl font-bold text-text-primary">{formatCurrency(expense.amount, expense.currency)}</p>
        {expense.currency !== group.currency && (
          <p className="text-sm text-text-secondary mt-1">≈ {formatCurrency(expense.amount * expense.exchangeRate, group.currency)} ({group.currency})</p>
        )}
      </div>

      <div className="space-y-3">
        <div className="bg-bg-secondary border border-border rounded-xl p-4">
          <p className="text-xs text-text-secondary mb-1">Pagado por</p>
          <p className="text-sm font-medium text-text-primary">{expense.paidByName}</p>
        </div>

        <div className="bg-bg-secondary border border-border rounded-xl p-4">
          <p className="text-xs text-text-secondary mb-1">Fecha</p>
          <p className="text-sm font-medium text-text-primary">{formatDateTime(expense.createdAt)}</p>
        </div>

        <div className="bg-bg-secondary border border-border rounded-xl p-4">
          <p className="text-xs text-text-secondary mb-1">Tipo de reparto</p>
          <p className="text-sm font-medium text-text-primary">
            {expense.splitType === 'equal' ? 'Equitativo' : expense.splitType === 'amount' ? 'Por cantidad' : 'Por porcentaje'}
          </p>
        </div>

        <div className="bg-bg-secondary border border-border rounded-xl p-4">
          <p className="text-xs text-text-secondary mb-3">Repartido entre ({expense.splitAmong.length} personas)</p>
          <div className="space-y-2">
            {expense.splitAmong.map((uid) => {
              const member = group.members.find((m) => m.uid === uid);
              let share: number;

              if (expense.splitType === 'equal') share = perPerson;
              else if (expense.splitDetails && expense.splitDetails[uid] !== undefined) {
                share = expense.splitType === 'percentage' ? (expense.amount * expense.splitDetails[uid]) / 100 : expense.splitDetails[uid];
              } else share = 0;

              return (
                <div key={uid} className="flex items-center justify-between">
                  <span className="text-sm text-text-primary">{member?.displayName || 'Desconocido'}</span>
                  <span className="text-sm font-medium text-neon-pink">{formatCurrency(share, expense.currency)}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Eliminar gasto">
        <p className="text-sm text-text-secondary mb-5">¿Estás seguro de que quieres eliminar "{expense.description}"? Esta acción no se puede deshacer.</p>
        <div className="flex gap-3">
          <button onClick={() => setShowDeleteModal(false)} className="flex-1 py-2.5 bg-bg-tertiary border border-border text-text-primary rounded-xl hover:bg-border transition-colors text-sm font-medium">Cancelar</button>
          <button onClick={handleDelete} disabled={deleting} className="flex-1 py-2.5 bg-neon-red/20 border border-neon-red/30 text-neon-red rounded-xl hover:bg-neon-red/30 transition-colors text-sm font-medium disabled:opacity-50">
            {deleting ? <LoadingSpinner size="sm" className="justify-center" /> : 'Eliminar'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
