/**
 * Dashboard – shows the user's stats, streak, and weak subjects.
 * Data flow: mounts → GET /api/progress/stats → render cards.
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { progressApi } from '../api/client';
import { useAuth } from '../context/AuthContext';

function StatCard({ label, value, sub }) {
  return (
    <div
      className="rounded-lg p-4 flex flex-col gap-1"
      style={{
        background: 'var(--bg-panel)',
        border: '1px solid var(--border)',
      }}
    >
      <p
        className="text-2xl font-semibold tracking-tight"
        style={{ color: 'var(--text-primary)', letterSpacing: '-0.03em' }}
      >
        {value}
      </p>
      <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{label}</p>
      {sub && <p className="text-xs" style={{ color: 'var(--text-faint)' }}>{sub}</p>}
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
      {/* Page header */}
      <div className="mb-8">
        <h1
          className="text-2xl font-semibold tracking-tight"
          style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}
        >
          Welcome back, {user?.username}
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          Your learning overview
        </p>
      </div>

      {loading && (
        <div
          className="flex items-center gap-3 text-sm py-12 justify-center"
          style={{ color: 'var(--text-faint)' }}
        >
          <div
            className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }}
          />
          Loading…
        </div>
      )}

      {error && (
        <p
          className="text-sm rounded-lg px-4 py-3 mb-6"
          style={{
            background: 'var(--danger-dim)',
            color: 'var(--danger)',
            border: '1px solid rgba(229,72,77,0.25)',
          }}
        >
          {error}
        </p>
      )}

      {stats && (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
            <StatCard label="Quizzes" value={stats.total_quizzes} />
            <StatCard
              label="Accuracy"
              value={`${Math.round(stats.overall_accuracy * 100)}%`}
            />
            <StatCard
              label="Streak"
              value={stats.current_streak}
              sub="days in a row"
            />
          </div>

          {/* Weak subjects */}
          {stats.weak_subjects.length > 0 && (
            <div
              className="rounded-lg p-5 mb-6"
              style={{
                background: 'var(--bg-panel)',
                border: '1px solid var(--border)',
              }}
            >
              <h2
                className="text-sm font-semibold mb-3"
                style={{ color: 'var(--text-primary)' }}
              >
                Areas to improve
              </h2>
              <div className="space-y-2">
                {stats.weak_subjects.map((ws) => (
                  <div
                    key={ws.category_id}
                    className="flex items-center justify-between rounded-md px-3 py-2"
                    style={{ background: 'var(--bg-elevated)' }}
                  >
                    <span className="text-sm" style={{ color: 'var(--text-body)' }}>
                      {ws.category_name}
                    </span>
                    <span
                      className="text-xs font-semibold px-2 py-0.5 rounded-full"
                      style={{
                        background: 'var(--danger-dim)',
                        color: 'var(--danger)',
                      }}
                    >
                      {Math.round(ws.average_accuracy * 100)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent activity */}
          <div
            className="rounded-lg mb-8"
            style={{
              background: 'var(--bg-panel)',
              border: '1px solid var(--border)',
            }}
          >
            <div
              className="px-5 py-3 border-b"
              style={{ borderColor: 'var(--border)' }}
            >
              <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                Recent Activity
              </h2>
            </div>
            {stats.recent_activity.length > 0 ? (
              <div>
                {stats.recent_activity.map((a, idx) => (
                  <div
                    key={a.id}
                    className="flex items-center justify-between px-5 py-3 text-sm"
                    style={{
                      borderBottom:
                        idx < stats.recent_activity.length - 1
                          ? '1px solid var(--border)'
                          : 'none',
                    }}
                  >
                    <div>
                      <span style={{ color: 'var(--text-body)' }}>{a.category_name}</span>
                      <span className="ml-2 text-xs" style={{ color: 'var(--text-faint)' }}>
                        {new Date(a.quiz_date).toLocaleDateString()}
                      </span>
                    </div>
                    <span
                      className="text-xs font-semibold px-2 py-0.5 rounded-full"
                      style={
                        a.accuracy >= 0.8
                          ? { background: 'var(--success-dim)', color: 'var(--success)' }
                          : a.accuracy >= 0.6
                          ? { background: 'var(--warning-dim)', color: 'var(--warning)' }
                          : { background: 'var(--danger-dim)', color: 'var(--danger)' }
                      }
                    >
                      {a.score}/{a.total_questions} · {Math.round(a.accuracy * 100)}%
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="px-5 py-6 text-sm text-center" style={{ color: 'var(--text-faint)' }}>
                No activity yet — start your first quiz below.
              </p>
            )}
          </div>
        </>
      )}

      {/* CTA */}
      <Link
        to="/quiz"
        className="inline-flex items-center gap-2 text-sm font-semibold px-5 py-2.5 rounded-md transition-all"
        style={{
          background: 'var(--accent)',
          color: '#fff',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent-hover)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'var(--accent)'; }}
      >
        Start a Quiz →
      </Link>
    </div>
  );
}
