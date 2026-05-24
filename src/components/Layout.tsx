import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { getInitials } from '../utils/formatters';
import { BottomNav } from './BottomNav';

export function Layout() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isOnline = useOnlineStatus();
  const showBackButton = location.pathname !== '/';

  return (
    <div className="min-h-screen bg-bg-primary flex flex-col">
      {!isOnline && (
        <div className="bg-neon-pink/20 border-b border-neon-pink/30 text-neon-pink text-center py-1.5 text-sm font-medium">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2 h-2 bg-neon-pink rounded-full animate-pulse" />
            Sin conexión — Los cambios se sincronizarán al reconectar
          </span>
        </div>
      )}

      <header className="sticky top-0 z-40 bg-bg-primary/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {showBackButton ? (
              <button onClick={() => navigate(-1)} className="p-1.5 -ml-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-secondary transition-colors" aria-label="Volver">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            ) : (
              <button onClick={() => navigate('/')} className="flex items-center gap-2 group">
                <span className="text-xl font-bold bg-gradient-to-r from-neon-pink to-neon-pink-light bg-clip-text text-transparent">Split</span>
                <span className="text-xl font-bold text-neon-green">Count</span>
              </button>
            )}
          </div>

          {user && (
            <button onClick={() => navigate('/profile')} className="w-9 h-9 rounded-full bg-gradient-to-br from-neon-pink to-neon-pink-light flex items-center justify-center text-white text-sm font-semibold hover:shadow-[0_0_15px_rgba(255,45,138,0.4)] transition-shadow overflow-hidden">
              {user.photoURL ? (
                <img src={user.photoURL} alt={user.displayName || 'Avatar'} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                getInitials(user.displayName || user.email || 'U')
              )}
            </button>
          )}
        </div>
      </header>

      
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 pb-24">
        <Outlet />
      </main>

      <BottomNav />
    </div>
  );
}
