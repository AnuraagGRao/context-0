/**
 * QuizResults – displays a summary after the user completes a quiz.
 *
 * Props:
 *   result        – QuizResult object from the API (score, total, accuracy, results[])
 *   onRetry       – callback to start a new quiz
 *   onDashboard   – callback to navigate to dashboard
 */
export default function QuizResults({ result, onRetry, onDashboard }) {
  const pct = Math.round(result.accuracy * 100);

  const gradeInfo = () => {
    if (pct >= 80) return { label: 'Excellent', style: { color: 'var(--success)' } };
    if (pct >= 60) return { label: 'Good Job', style: { color: 'var(--warning)' } };
    return { label: 'Keep Practising', style: { color: 'var(--danger)' } };
  };

  const { label, style } = gradeInfo();

  return (
    <div
      className="rounded-xl p-6 max-w-2xl w-full"
      style={{
        background: 'var(--bg-panel)',
        border: '1px solid var(--border-strong)',
      }}
    >
      {/* Score header */}
      <div className="mb-6 pb-5" style={{ borderBottom: '1px solid var(--border)' }}>
        <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-faint)' }}>
          Results
        </p>
        <h2
          className="text-2xl font-semibold tracking-tight"
          style={{ ...style, letterSpacing: '-0.02em' }}
        >
          {label}
        </h2>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          {result.score} / {result.total_questions} correct &middot; {pct}% accuracy
        </p>
      </div>

      {/* Per-question breakdown */}
      <div className="space-y-2 mb-6">
        {result.results.map((r, i) => (
          <div
            key={r.question_id}
            className="rounded-lg p-3"
            style={{
              background: 'var(--bg-elevated)',
              border: `1px solid ${r.is_correct ? 'rgba(39,166,68,0.2)' : 'rgba(229,72,77,0.2)'}`,
            }}
          >
            <div className="flex items-start gap-3">
              <span
                className="text-xs font-bold mt-0.5"
                style={{ color: r.is_correct ? 'var(--success)' : 'var(--danger)' }}
              >
                {r.is_correct ? '✓' : '✗'}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                  Question {i + 1}
                </p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-faint)' }}>
                  Your answer:{' '}
                  <span style={{ color: r.is_correct ? 'var(--success)' : 'var(--danger)' }}>
                    {r.selected_option}
                  </span>
                  {!r.is_correct && (
                    <span style={{ color: 'var(--success)', marginLeft: '8px' }}>
                      Correct: {r.correct_option}
                    </span>
                  )}
                </p>
                {r.explanation && (
                  <p
                    className="text-xs mt-1.5 pt-1.5 italic"
                    style={{
                      color: 'var(--text-faint)',
                      borderTop: '1px solid var(--border)',
                    }}
                  >
                    {r.explanation}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        <button
          onClick={onRetry}
          className="flex-1 py-2 rounded-md text-sm font-semibold transition-all"
          style={{ background: 'var(--accent)', color: '#fff' }}
          onMouseEnter={e => { e.target.style.background = 'var(--accent-hover)'; }}
          onMouseLeave={e => { e.target.style.background = 'var(--accent)'; }}
        >
          New Quiz
        </button>
        <button
          onClick={onDashboard}
          className="flex-1 py-2 rounded-md text-sm font-semibold transition-all"
          style={{
            background: 'transparent',
            border: '1px solid var(--border-strong)',
            color: 'var(--text-body)',
          }}
          onMouseEnter={e => { e.target.style.background = 'var(--bg-elevated)'; }}
          onMouseLeave={e => { e.target.style.background = 'transparent'; }}
        >
          Dashboard
        </button>
      </div>
    </div>
  );
}
