import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-6">
        <Link to="/dashboard" className="text-xl font-bold text-indigo-600">
          🧠 QuizMaster
        </Link>
        <Link to="/dashboard" className="text-sm font-medium text-gray-600 hover:text-indigo-600 transition-colors">
          Dashboard
        </Link>
        <Link to="/quiz" className="text-sm font-medium text-gray-600 hover:text-indigo-600 transition-colors">
          Take Quiz
        </Link>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-500">{user?.username}</span>
        <button
          onClick={handleLogout}
          className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg transition-colors"
        >
          Logout
        </button>
      </div>
    </nav>
  );
}
