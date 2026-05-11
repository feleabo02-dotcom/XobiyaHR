import { useState, type FormEvent } from 'react';
import { useAuth } from '../lib/AuthContext';
import { Target } from 'lucide-react';

export default function LoginPage() {
  const { login, register } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      if (isRegister) {
        await register(email, password, displayName);
      } else {
        await login(email, password);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-white p-6">
      <div className="max-w-md w-full space-y-8 text-center">
        <div className="flex justify-center mb-8">
          <div className="w-16 h-16 bg-neutral-900 flex items-center justify-center text-white">
            <Target size={32} />
          </div>
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-neutral-900 font-sans">xobiya HR</h1>
        <p className="text-neutral-500 font-sans">Enterprise Resource Planning & Human Capital Management</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4 text-left">
          {isRegister && (
            <div>
              <label className="label-swiss">Full Name</label>
              <input
                type="text"
                required
                className="input-swiss"
                placeholder="John Doe"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
              />
            </div>
          )}
          <div>
            <label className="label-swiss">Email</label>
            <input
              type="email"
              required
              className="input-swiss"
              placeholder="admin@xobiya.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="label-swiss">Password</label>
            <input
              type="password"
              required
              className="input-swiss"
              placeholder="Enter password"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>

          {error && (
            <p className="text-red-600 text-xs font-bold uppercase tracking-wider">{error}</p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {busy ? 'Processing...' : isRegister ? 'Create Account' : 'Sign in'}
          </button>
        </form>

        <button
          onClick={() => { setIsRegister(!isRegister); setError(''); }}
          className="text-xs text-blue-600 hover:text-blue-800 font-semibold"
        >
          {isRegister ? 'Already have an account? Sign in' : 'New user? Create an account'}
        </button>

        <p className="text-[10px] text-neutral-400 font-mono uppercase tracking-widest mt-12">
          Secure Terminal / v1.0.0
        </p>
      </div>
    </div>
  );
}
