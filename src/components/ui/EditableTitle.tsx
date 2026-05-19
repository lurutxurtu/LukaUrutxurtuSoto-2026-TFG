import { useState, useEffect } from 'react';
import { Edit2, X, Check } from 'lucide-react';
import { LoadingSpinner } from './LoadingSpinner';

interface EditableTitleProps {
  initialName: string;
  onSave: (newName: string) => Promise<void>;
  canEdit: boolean;
  centered?: boolean;
  fallbackName?: string;
}

export function EditableTitle({ initialName, onSave, canEdit, centered = false, fallbackName = 'Sin nombre' }: EditableTitleProps) {
  const [editing, setEditing] = useState(false);
  const [newName, setNewName] = useState(initialName);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setNewName(initialName);
  }, [initialName]);

  const handleSave = async () => {
    if (!newName.trim() || newName.trim() === initialName) {
      setEditing(false);
      setNewName(initialName);
      return;
    }
    setLoading(true);
    try {
      await onSave(newName.trim());
      setEditing(false);
    } catch (err) {
      console.error('Error al actualizar el título:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!editing) {
    return (
      <div className={`flex items-start gap-3 mb-2 ${centered ? 'justify-center' : ''}`}>
        <h1 className={`text-2xl font-bold text-text-primary break-words ${centered ? '' : 'flex-1'}`}>
          {newName || fallbackName}
        </h1>
        {canEdit && (
          <button
            onClick={() => setEditing(true)}
            className="p-2 text-text-muted hover:text-neon-pink hover:bg-neon-pink/10 rounded-full transition-all flex-shrink-0 mt-0.5"
            aria-label="Editar título"
          >
            <Edit2 className="w-4 h-4" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={`flex items-start gap-3 mb-2 ${centered ? 'justify-center max-w-xs mx-auto' : ''}`}>
      <div className="flex-1 flex items-center gap-2">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          className={`flex-1 bg-bg-secondary border border-border text-text-primary px-3 py-1.5 rounded-lg text-xl font-bold focus:outline-none focus:border-neon-pink focus:ring-1 focus:ring-neon-pink ${centered ? 'text-center' : ''}`}
          autoFocus
          disabled={loading}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSave();
            if (e.key === 'Escape') {
              setEditing(false);
              setNewName(initialName);
            }
          }}
        />
        <button
          onClick={handleSave}
          disabled={loading}
          className="p-1.5 text-neon-green hover:bg-neon-green/10 rounded-lg transition-colors"
        >
          {loading ? <LoadingSpinner size="sm" /> : <Check className="w-5 h-5" />}
        </button>
        <button
          onClick={() => {
            setEditing(false);
            setNewName(initialName);
          }}
          disabled={loading}
          className="p-1.5 text-text-muted hover:text-text-primary hover:bg-bg-secondary rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
