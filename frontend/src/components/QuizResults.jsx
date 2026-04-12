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
    if (pct >= 80) return { emoji: '🏆', label: 'Excellent!', color: 'text-green-600' };
    if (pct >= 60) return { emoji: '👍', label: 'Good Job!', color: 'text-yellow-600' };
    return { emoji: '📚', label: 'Keep Practising!', color: 'text-red-500' };
  };

  const { emoji, label, color } = gradeInfo();

  return (
    <div className="bg-white rounded-2xl shadow-md p-8 max-w-2xl w-full">
      {/* Score header */}
      <div className="text-center mb-8">
        <span className="text-6xl">{emoji}</span>
        <h2 className={`text-3xl font-bold mt-3 ${color}`}>{label}</h2>
        <p className="text-gray-500 mt-1">
          You scored{' '}
          <strong className="text-gray-900">
            {result.score} / {result.total_questions}
          </strong>{' '}
          ({pct}%)
        </p>
      </div>

      {/* Per-question breakdown */}
      <div className="space-y-3 mb-8">
        {result.results.map((r, i) => (
          <div
            key={r.question_id}
            className={`p-3 rounded-xl border ${
              r.is_correct
                ? 'border-green-200 bg-green-50'
                : 'border-red-200 bg-red-50'
            }`}
          >
            <div className="flex items-start gap-3">
              <span className="text-xl mt-0.5">{r.is_correct ? '✅' : '❌'}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800">Question {i + 1}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Your answer:{' '}
                  <span className={r.is_correct ? 'text-green-700' : 'text-red-600'}>
                    {r.selected_option}
                  </span>
                  {!r.is_correct && (
                    <span className="text-green-700 ml-2">
                      · Correct: {r.correct_option}
                    </span>
                  )}
                </p>
                {r.explanation && (
                  <p className="text-xs text-gray-600 mt-1 italic border-t border-gray-200 pt-1">
                    💡 {r.explanation}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Action buttons */}
      <div className="flex gap-3">
        <button
          onClick={onRetry}
          className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-xl transition-colors"
        >
          🔁 New Quiz
        </button>
        <button
          onClick={onDashboard}
          className="flex-1 border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50 font-semibold py-2.5 rounded-xl transition-colors"
        >
          📊 Dashboard
        </button>
      </div>
    </div>
  );
}
