import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';

export function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { signIn, signUp, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await signIn(email, password);
      } else {
        if (!name.trim()) {
          setError('El nombre es obligatorio para registrarse');
          setLoading(false);
          return;
        }
        await signUp(email, password, name.trim());
      }
      navigate('/');
    } catch (err: unknown) {
      const error = err as { code?: string };
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
        setError('Email o contraseña incorrectos');
      } else if (error.code === 'auth/email-already-in-use') {
        setError('El email ya está registrado');
      } else if (error.code === 'auth/weak-password') {
        setError('La contraseña debe tener al menos 6 caracteres');
      } else {
        setError('Ocurrió un error. Inténtalo de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      await signInWithGoogle();
      navigate('/');
    } catch (err: unknown) {
      console.error('Error completo de Google Auth:', err);

      setError(err instanceof Error ? err.message : 'Error al iniciar sesión con Google. Revisa la consola.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-primary flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-neon-pink/20 rounded-full mix-blend-screen filter blur-[100px] opacity-50 animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-neon-green/10 rounded-full mix-blend-screen filter blur-[100px] opacity-50 animate-pulse" style={{ animationDelay: '2s' }} />

      <div className="w-full max-w-md relative z-10">
        <div className="flex justify-center mb-6">
          <div className="w-24 h-24 bg-bg-secondary border border-border rounded-[2rem] flex items-center justify-center shadow-[0_0_40px_rgba(255,45,138,0.2)] relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-neon-pink/20 to-transparent" />
            <span className="text-5xl font-extrabold bg-gradient-to-br from-neon-pink to-neon-pink-light bg-clip-text text-transparent transform -skew-x-6">SC</span>
          </div>
        </div>
        <h2 className="text-center text-3xl font-extrabold tracking-tight text-text-primary">
          {isLogin ? 'Bienvenido de nuevo' : 'Crea tu cuenta'}
        </h2>
        <p className="mt-3 text-center text-sm text-text-secondary">
          {isLogin ? 'Inicia sesión para gestionar tus gastos' : 'Únete a SplitCount para dividir gastos con amigos'}
        </p>
      </div>

      <div className="mt-8 w-full max-w-md relative z-10">
        <div className="bg-bg-secondary/60 backdrop-blur-2xl py-8 px-6 shadow-2xl rounded-3xl border border-border/50 sm:px-10">
          <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
            {!isLogin && (
              <div className="animate-slide-up">
                <label htmlFor="name" className="block text-sm font-medium text-text-primary mb-1.5">Nombre visible</label>
                <div className="mt-1">
                  <input id="name" name="name" type="text" required={!isLogin} value={name} onChange={(e) => setName(e.target.value)} className="block w-full rounded-xl border border-border bg-bg-tertiary/50 px-4 py-3.5 text-text-primary placeholder-text-muted focus:border-neon-pink focus:outline-none focus:ring-1 focus:ring-neon-pink/50 transition-all" placeholder="Ej: Luka Urutxurtu" />
                </div>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-text-primary mb-1.5">Correo electrónico</label>
              <div className="mt-1">
                <input id="email" name="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="block w-full rounded-xl border border-border bg-bg-tertiary/50 px-4 py-3.5 text-text-primary placeholder-text-muted focus:border-neon-pink focus:outline-none focus:ring-1 focus:ring-neon-pink/50 transition-all" placeholder="tucorreo@ejemplo.com" />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-text-primary mb-1.5">Contraseña</label>
              <div className="mt-1">
                <input id="password" name="password" type="password" autoComplete={isLogin ? 'current-password' : 'new-password'} required value={password} onChange={(e) => setPassword(e.target.value)} className="block w-full rounded-xl border border-border bg-bg-tertiary/50 px-4 py-3.5 text-text-primary placeholder-text-muted focus:border-neon-pink focus:outline-none focus:ring-1 focus:ring-neon-pink/50 transition-all" placeholder="••••••••" />
              </div>
            </div>

            {error && (
              <div className="rounded-xl border border-neon-red/30 bg-neon-red/10 p-3.5 animate-fade-in">
                <p className="text-sm font-medium text-neon-red text-center">{error}</p>
              </div>
            )}

            <div className="pt-2">
              <button type="submit" disabled={loading} className="group relative flex w-full justify-center rounded-xl bg-gradient-to-r from-neon-pink to-neon-pink-light px-4 py-3.5 text-base font-semibold text-white shadow-lg hover:shadow-[0_0_25px_rgba(255,45,138,0.5)] focus:outline-none focus:ring-2 focus:ring-neon-pink focus:ring-offset-2 focus:ring-offset-bg-primary disabled:opacity-50 transition-all">
                {loading ? <LoadingSpinner size="sm" /> : isLogin ? 'Iniciar sesión' : 'Registrarse'}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-bg-secondary px-2 text-text-muted">O continúa con</span>
              </div>
            </div>

            <div className="mt-6">
              <button onClick={handleGoogleSignIn} type="button" disabled={loading} className="flex w-full items-center justify-center gap-3 rounded-xl border border-border/80 bg-bg-primary/50 px-4 py-3.5 text-sm font-medium text-text-primary hover:bg-bg-tertiary hover:border-text-muted focus:outline-none focus:ring-2 focus:ring-neon-pink focus:ring-offset-2 focus:ring-offset-bg-primary disabled:opacity-50 transition-all">
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                <span>Continuar con Google</span>
              </button>
            </div>
          </div>

          <div className="mt-8 text-center">
            <button onClick={() => { setIsLogin(!isLogin); setError(''); }} type="button" className="text-sm font-medium text-text-secondary hover:text-neon-pink transition-colors">
              {isLogin ? '¿No tienes cuenta? ' : '¿Ya tienes cuenta? '}
              <span className="text-neon-pink underline decoration-neon-pink/30 underline-offset-4">{isLogin ? 'Regístrate aquí' : 'Inicia sesión'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
