/**
 * Dashboard – shows the user's stats, streak, and weak subjects.
 * Data flow: mounts → GET /api/progress/stats → render cards.
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { progressApi } from '../api/client';
import { useAuth } from '../context/AuthContext';

function StatCard({ emoji, label, value, sub }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex items-center gap-4">
      <span className="text-4xl">{emoji}</span>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-sm font-medium text-gray-500">{label}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    progressApi
      .getStats()
      .then((res) => setStats(res.data))
      .catch(() => setError('Could not load your stats. Try again later.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          👋 Welcome back, {user?.username}!
        </h1>
        <p className="text-gray-500 mt-1">Here's your learning overview</p>
      </div>

      {loading && (
        <div className="text-center py-16 text-gray-400">Loading your stats…</div>
      )}

      {error && (
        <p className="text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-6">
          {error}
        </p>
      )}

      {stats && (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <StatCard emoji="📝" label="Quizzes Taken" value={stats.total_quizzes} />
            <StatCard
              emoji="🎯"
              label="Overall Accuracy"
              value={`${Math.round(stats.overall_accuracy * 100)}%`}
            />
            <StatCard
              emoji="🔥"
              label="Current Streak"
              value={stats.current_streak}
              sub="days in a row"
            />
          </div>

          {/* Weak subjects */}
          {stats.weak_subjects.length > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-2xl p-5 mb-8">
              <h2 className="text-lg font-semibold text-orange-800 mb-3">
                📉 Subjects to Improve
              </h2>
              <div className="space-y-2">
                {stats.weak_subjects.map((ws) => (
                  <div
                    key={ws.category_id}
                    className="flex items-center justify-between bg-white rounded-xl px-4 py-2.5 shadow-sm"
                  >
                    <span className="font-medium text-gray-800">{ws.category_name}</span>
                    <span className="text-red-500 font-bold text-sm">
                      {Math.round(ws.average_accuracy * 100)}% avg
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent activity */}
          {stats.recent_activity.length > 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-8">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Recent Activity</h2>
              <div className="space-y-2">
                {stats.recent_activity.map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center justify-between text-sm py-2 border-b border-gray-50 last:border-0"
                  >
                    <div>
                      <span className="font-medium text-gray-800">{a.category_name}</span>
                      <span className="text-gray-400 ml-2">
                        {new Date(a.quiz_date).toLocaleDateString()}
                      </span>
                    </div>
                    <span
                      className={`font-bold ${
                        a.accuracy >= 0.8
                          ? 'text-green-600'
                          : a.accuracy >= 0.6
                          ? 'text-yellow-600'
                          : 'text-red-500'
                      }`}
                    >
                      {a.score}/{a.total_questions} ({Math.round(a.accuracy * 100)}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center mb-8">
              <p className="text-gray-500">No quiz activity yet.</p>
            </div>
          )}
        </>
      )}

      {/* CTA */}
      <div className="text-center">
        <Link
          to="/quiz"
          className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-8 py-3 rounded-xl transition-colors"
        >
          🚀 Start a New Quiz
        </Link>
      </div>
    </div>
  );
}
