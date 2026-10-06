/**
 * Login form component.
 * On submit: calls authApi.login → receives JWT → stores in localStorage via AuthContext.
 */
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.username, form.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'var(--bg-base)' }}
    >
      <div
        className="w-full max-w-sm rounded-xl p-8"
        style={{
          background: 'var(--bg-panel)',
          border: '1px solid var(--border-strong)',
        }}
      >
        {/* Header */}
        <div className="mb-8">
          <div
            className="inline-flex items-center gap-2 mb-6 text-xs font-medium px-2.5 py-1 rounded-full"
            style={{ background: 'var(--accent-dim)', color: 'var(--accent-hover)' }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Context0
          </div>
          <h1
            className="text-xl font-semibold tracking-tight"
            style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}
          >
            Welcome back
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            Sign in to your account
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              className="block text-xs font-medium mb-1.5"
              style={{ color: 'var(--text-muted)' }}
            >
              Username
            </label>
            <input
              type="text"
              name="username"
              value={form.username}
              onChange={handleChange}
              required
              className="w-full rounded-md px-3 py-2 text-sm outline-none transition-all"
              style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-strong)',
                color: 'var(--text-primary)',
              }}
              onFocus={e => { e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = '0 0 0 3px var(--accent-dim)'; }}
              onBlur={e => { e.target.style.borderColor = 'var(--border-strong)'; e.target.style.boxShadow = 'none'; }}
              placeholder="your_username"
            />
          </div>

          <div>
            <label
              className="block text-xs font-medium mb-1.5"
              style={{ color: 'var(--text-muted)' }}
            >
              Password
            </label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              required
              className="w-full rounded-md px-3 py-2 text-sm outline-none transition-all"
              style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-strong)',
                color: 'var(--text-primary)',
              }}
              onFocus={e => { e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = '0 0 0 3px var(--accent-dim)'; }}
              onBlur={e => { e.target.style.borderColor = 'var(--border-strong)'; e.target.style.boxShadow = 'none'; }}
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p
              className="text-xs rounded-md px-3 py-2"
              style={{
                background: 'var(--danger-dim)',
                color: 'var(--danger)',
                border: '1px solid rgba(229,72,77,0.25)',
              }}
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 rounded-md text-sm font-semibold transition-all disabled:opacity-50"
            style={{
              background: 'var(--accent)',
              color: '#fff',
            }}
            onMouseEnter={e => { if (!loading) e.target.style.background = 'var(--accent-hover)'; }}
            onMouseLeave={e => { e.target.style.background = 'var(--accent)'; }}
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-xs mt-6" style={{ color: 'var(--text-faint)' }}>
          No account?{' '}
          <Link to="/register" className="font-medium" style={{ color: 'var(--accent-hover)' }}>
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
