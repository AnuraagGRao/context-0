/**
 * QuizQuestion – renders a single multiple-choice question.
 *
 * Props:
 *   question     – Question object from the API
 *   selected     – currently selected option key ('A'|'B'|'C'|'D'|null)
 *   onSelect     – callback(optionKey) called when user picks an answer
 *   revealed     – boolean; when true shows correct/incorrect colouring
 *   correctOption – the correct answer key (only used when revealed=true)
 *   questionNumber – 1-based index for display
 *   totalQuestions – total number of questions in this quiz
 */
export default function QuizQuestion({
  question,
  selected,
  onSelect,
  revealed,
  correctOption,
  questionNumber,
  totalQuestions,
}) {
  const options = [
    { key: 'A', text: question.option_a },
    { key: 'B', text: question.option_b },
    { key: 'C', text: question.option_c },
    { key: 'D', text: question.option_d },
  ];

  /**
   * Returns inline style object for each answer button.
   */
  const getOptionStyle = (key) => {
    const base = {
      display: 'block',
      width: '100%',
      textAlign: 'left',
      padding: '10px 14px',
      borderRadius: '6px',
      border: '1px solid',
      transition: 'all 0.15s',
      fontSize: '0.875rem',
      cursor: revealed ? 'default' : 'pointer',
    };

    if (!revealed) {
      if (key === selected) {
        return {
          ...base,
          borderColor: 'var(--accent)',
          background: 'var(--accent-dim)',
          color: 'var(--text-primary)',
          boxShadow: '0 0 0 2px var(--accent-dim)',
        };
      }
      return {
        ...base,
        borderColor: 'var(--border)',
        background: 'var(--bg-elevated)',
        color: 'var(--text-body)',
      };
    }

    if (key === correctOption) {
      return {
        ...base,
        borderColor: 'rgba(39,166,68,0.4)',
        background: 'var(--success-dim)',
        color: 'var(--success)',
      };
    }
    if (key === selected && key !== correctOption) {
      return {
        ...base,
        borderColor: 'rgba(229,72,77,0.4)',
        background: 'var(--danger-dim)',
        color: 'var(--danger)',
      };
    }
    return {
      ...base,
      borderColor: 'var(--border)',
      background: 'transparent',
      color: 'var(--text-faint)',
    };
  };

  const difficultyStyle = {
    easy:   { background: 'var(--success-dim)', color: 'var(--success)' },
    medium: { background: 'var(--warning-dim)', color: 'var(--warning)' },
    hard:   { background: 'var(--danger-dim)',  color: 'var(--danger)'  },
  }[question.difficulty] || { background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)' };

  return (
    <div
      className="rounded-xl p-6 max-w-2xl w-full"
      style={{
        background: 'var(--bg-panel)',
        border: '1px solid var(--border-strong)',
      }}
    >
      {/* Progress & metadata bar */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs" style={{ color: 'var(--text-faint)' }}>
          {questionNumber} / {totalQuestions}
        </span>
        <div className="flex items-center gap-1.5">
          <span
            className="text-xs px-2 py-0.5 rounded-full font-medium"
            style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)' }}
          >
            {question.category.name}
          </span>
          <span
            className="text-xs px-2 py-0.5 rounded-full font-medium capitalize"
            style={difficultyStyle}
          >
            {question.difficulty}
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div
        className="w-full rounded-full h-0.5 mb-6"
        style={{ background: 'var(--border)' }}
      >
        <div
          className="h-0.5 rounded-full transition-all"
          style={{
            width: `${(questionNumber / totalQuestions) * 100}%`,
            background: 'var(--accent)',
          }}
        />
      </div>

      {/* Question text */}
      <p
        className="text-base font-medium mb-5 leading-relaxed"
        style={{ color: 'var(--text-primary)' }}
      >
        {question.text}
      </p>

      {/* Answer options */}
      <div className="space-y-2">
        {options.map(({ key, text }) => (
          <button
            key={key}
            onClick={() => !revealed && onSelect(key)}
            disabled={revealed}
            style={getOptionStyle(key)}
          >
            <span className="flex items-center justify-between gap-3">
              <span>
                <span
                  className="inline-block w-5 text-xs font-bold mr-2"
                  style={{ color: revealed ? 'inherit' : 'var(--accent)' }}
                >
                  {key}
                </span>
                {text}
              </span>
              {revealed && key === correctOption && (
                <span className="text-sm flex-shrink-0">✓</span>
              )}
              {revealed && key === selected && key !== correctOption && (
                <span className="text-sm flex-shrink-0">✗</span>
              )}
            </span>
          </button>
        ))}
      </div>

      {/* Explanation (shown after reveal) */}
      {revealed && question.explanation && (
        <div
          className="mt-4 rounded-lg px-4 py-3"
          style={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border)',
          }}
        >
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            <span className="font-semibold" style={{ color: 'var(--text-body)' }}>Explanation: </span>
            {question.explanation}
          </p>
        </div>
      )}
    </div>
  );
}
