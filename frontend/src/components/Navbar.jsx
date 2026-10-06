/**
 * Navbar – top navigation bar with links and a logout button.
 */
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLink = (to, label) => (
    <Link
      to={to}
      style={
        pathname === to
          ? { background: 'var(--accent-dim)', color: 'var(--accent-hover)' }
          : {}
      }
      className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
        pathname === to
          ? ''
          : 'hover:bg-white/5'
      }`}
    >
      {label}
    </Link>
  );

  return (
    <nav
      className="sticky top-0 z-20 border-b"
      style={{
        background: 'rgba(15,16,17,0.85)',
        borderColor: 'var(--border)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        color: 'var(--text-muted)',
      }}
    >
      <div className="max-w-4xl mx-auto px-4 py-2.5 flex items-center justify-between">
        <Link
          to="/dashboard"
          className="flex items-center gap-2 font-semibold text-sm tracking-tight"
          style={{ color: 'var(--text-primary)', letterSpacing: '-0.01em' }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ color: 'var(--accent)' }} className="flex-shrink-0">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Context0
        </Link>

        <div className="flex items-center gap-1">
          {navLink('/dashboard', 'Dashboard')}
          {navLink('/quiz', 'Quiz')}
          <div className="w-px h-4 mx-1" style={{ background: 'var(--border-strong)' }} />
          <span className="text-xs hidden sm:block px-2" style={{ color: 'var(--text-faint)' }}>
            {user?.username}
          </span>
          <button
            onClick={handleLogout}
            className="text-xs px-3 py-1.5 rounded-md font-medium transition-all hover:bg-white/5"
            style={{ color: 'var(--text-muted)' }}
          >
            Sign out
          </button>
        </div>
      </div>
    </nav>
  );
}
