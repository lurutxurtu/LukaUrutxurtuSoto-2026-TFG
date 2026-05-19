import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getInitials } from '../utils/formatters';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { Modal } from '../components/ui/Modal';
import { EditableTitle } from '../components/ui/EditableTitle';

export function ProfilePage() {
  const { user, logout, updateUserProfile, changePassword, deleteAccount } = useAuth();
  const navigate = useNavigate();



  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

  const isEmailUser = user?.providerData.some((p) => p.providerId === 'password');



  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (newPassword !== confirmNewPassword) {
      setPasswordError('Las contraseñas no coinciden');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setPasswordLoading(true);
    try {
      await changePassword(currentPassword, newPassword);
      setPasswordSuccess('Contraseña actualizada correctamente');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setTimeout(() => setShowPasswordModal(false), 1500);
    } catch (err: unknown) {
      const error = err as { code?: string };
      if (error.code === 'auth/wrong-password') setPasswordError('Contraseña actual incorrecta');
      else setPasswordError('Error al cambiar la contraseña');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleteLoading(true);
    try {
      await deleteAccount(isEmailUser ? deletePassword : undefined);
      navigate('/login');
    } catch (err) {
      console.error('Error al eliminar cuenta:', err);
      setDeleteLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (!user) return null;

  return (
    <div className="py-6">
      <h1 className="text-2xl font-bold text-text-primary mb-6">Perfil</h1>

      <div className="bg-bg-secondary border border-border rounded-2xl p-6 mb-4 text-center">
        <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-neon-pink to-neon-pink-light flex items-center justify-center text-white text-2xl font-bold shadow-[0_0_20px_rgba(255,45,138,0.3)] overflow-hidden mb-4">
          {user.photoURL ? (
            <img src={user.photoURL} alt={user.displayName || 'Avatar'} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          ) : (
            getInitials(user.displayName || user.email || 'U')
          )}
        </div>

        <EditableTitle
          initialName={user.displayName || ''}
          fallbackName="Sin nombre"
          onSave={async (name) => {
            if (name.trim()) await updateUserProfile(name.trim());
          }}
          canEdit={true}
          centered={true}
        />

        <p className="text-sm text-text-secondary mt-1">{user.email}</p>

        <div className="inline-flex items-center gap-1.5 mt-3 px-3 py-1 bg-bg-tertiary rounded-full text-xs text-text-secondary">
          {isEmailUser ? (
            <><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" /></svg>Email y contraseña</>
          ) : (
            <><svg className="w-3 h-3" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/></svg>Google</>
          )}
        </div>
      </div>

      <div className="space-y-2">
        {isEmailUser && (
          <button onClick={() => { setShowPasswordModal(true); setPasswordError(''); setPasswordSuccess(''); setCurrentPassword(''); setNewPassword(''); setConfirmNewPassword(''); }} className="w-full p-4 bg-bg-secondary border border-border rounded-xl text-left hover:border-text-muted transition-all flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-bg-tertiary flex items-center justify-center"><svg className="w-5 h-5 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg></div>
            <div className="flex-1"><p className="text-sm font-medium text-text-primary">Cambiar contraseña</p><p className="text-xs text-text-secondary">Actualiza tu contraseña de acceso</p></div>
            <svg className="w-4 h-4 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
          </button>
        )}

        <button onClick={handleLogout} className="w-full p-4 bg-bg-secondary border border-border rounded-xl text-left hover:border-neon-pink/30 transition-all flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-neon-pink/10 flex items-center justify-center"><svg className="w-5 h-5 text-neon-pink" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" /></svg></div>
          <div className="flex-1"><p className="text-sm font-medium text-neon-pink">Cerrar sesión</p></div>
        </button>

        <button onClick={() => setShowDeleteModal(true)} className="w-full p-4 bg-bg-secondary border border-border rounded-xl text-left hover:border-neon-red/30 transition-all flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-neon-red/10 flex items-center justify-center"><svg className="w-5 h-5 text-neon-red" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg></div>
          <div className="flex-1"><p className="text-sm font-medium text-neon-red">Eliminar cuenta</p><p className="text-xs text-text-secondary">Esta acción es irreversible</p></div>
        </button>
      </div>

      <Modal isOpen={showPasswordModal} onClose={() => setShowPasswordModal(false)} title="Cambiar contraseña">
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label htmlFor="currentPwd" className="block text-sm font-medium text-text-secondary mb-1.5">Contraseña actual</label>
            <input id="currentPwd" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required className="w-full px-4 py-2.5 bg-bg-tertiary border border-border rounded-xl text-text-primary focus:outline-none focus:border-neon-pink focus:ring-1 focus:ring-neon-pink/30 transition-all" />
          </div>
          <div>
            <label htmlFor="newPwd" className="block text-sm font-medium text-text-secondary mb-1.5">Nueva contraseña</label>
            <input id="newPwd" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required className="w-full px-4 py-2.5 bg-bg-tertiary border border-border rounded-xl text-text-primary focus:outline-none focus:border-neon-pink focus:ring-1 focus:ring-neon-pink/30 transition-all" />
          </div>
          <div>
            <label htmlFor="confirmPwd" className="block text-sm font-medium text-text-secondary mb-1.5">Confirmar nueva contraseña</label>
            <input id="confirmPwd" type="password" value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} required className="w-full px-4 py-2.5 bg-bg-tertiary border border-border rounded-xl text-text-primary focus:outline-none focus:border-neon-pink focus:ring-1 focus:ring-neon-pink/30 transition-all" />
          </div>

          {passwordError && <p className="text-neon-red text-sm">{passwordError}</p>}
          {passwordSuccess && <p className="text-neon-green text-sm">{passwordSuccess}</p>}

          <button type="submit" disabled={passwordLoading} className="w-full py-3 bg-gradient-to-r from-neon-pink to-neon-pink-light text-white font-semibold rounded-xl hover:shadow-[0_0_20px_rgba(255,45,138,0.4)] transition-all disabled:opacity-50">
            {passwordLoading ? <LoadingSpinner size="sm" className="justify-center" /> : 'Cambiar contraseña'}
          </button>
        </form>
      </Modal>

      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Eliminar cuenta">
        <div className="space-y-4">
          <div className="p-3 bg-neon-red/10 border border-neon-red/20 rounded-xl">
            <p className="text-sm text-neon-red"> Esta acción eliminará tu cuenta permanentemente. No podrás recuperarla.</p>
          </div>

          {isEmailUser && (
            <div>
              <label htmlFor="deletePwd" className="block text-sm font-medium text-text-secondary mb-1.5">Confirma tu contraseña</label>
              <input id="deletePwd" type="password" value={deletePassword} onChange={(e) => setDeletePassword(e.target.value)} className="w-full px-4 py-2.5 bg-bg-tertiary border border-border rounded-xl text-text-primary focus:outline-none focus:border-neon-red focus:ring-1 focus:ring-neon-red/30 transition-all" />
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={() => setShowDeleteModal(false)} className="flex-1 py-2.5 bg-bg-tertiary border border-border text-text-primary rounded-xl hover:bg-border transition-colors text-sm font-medium">Cancelar</button>
            <button onClick={handleDeleteAccount} disabled={deleteLoading || (isEmailUser && !deletePassword)} className="flex-1 py-2.5 bg-neon-red/20 border border-neon-red/30 text-neon-red rounded-xl hover:bg-neon-red/30 transition-colors text-sm font-medium disabled:opacity-50">
              {deleteLoading ? <LoadingSpinner size="sm" className="justify-center" /> : 'Eliminar cuenta'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
