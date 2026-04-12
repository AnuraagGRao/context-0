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
      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
        pathname === to
          ? 'bg-indigo-100 text-indigo-700'
          : 'text-gray-600 hover:text-indigo-600 hover:bg-gray-100'
      }`}
    >
      {label}
    </Link>
  );

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-20">
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/dashboard" className="flex items-center gap-2 font-bold text-gray-900 text-lg">
          🧠 <span>QuizMaster</span>
        </Link>

        <div className="flex items-center gap-2">
          {navLink('/dashboard', '📊 Dashboard')}
          {navLink('/quiz', '🚀 Quiz')}
          <span className="text-gray-300 mx-1">|</span>
          <span className="text-sm text-gray-500 hidden sm:block">{user?.username}</span>
          <button
            onClick={handleLogout}
            className="ml-2 text-sm text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors font-medium"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}
