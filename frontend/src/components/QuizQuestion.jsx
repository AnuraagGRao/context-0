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
   * Compute the visual style for each answer button.
   * Before reveal: selected = indigo highlight, others = default.
   * After reveal: correct = green, wrong selection = red, rest = default.
   */
  const getOptionStyle = (key) => {
    const base =
      'w-full text-left px-5 py-3.5 rounded-xl border-2 transition-all duration-200 font-medium';

    if (!revealed) {
      return key === selected
        ? `${base} border-indigo-500 bg-indigo-50 text-indigo-800`
        : `${base} border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 cursor-pointer`;
    }

    // Post-reveal colouring
    if (key === correctOption) {
      return `${base} border-green-500 bg-green-50 text-green-800`;
    }
    if (key === selected && key !== correctOption) {
      return `${base} border-red-400 bg-red-50 text-red-800`;
    }
    return `${base} border-gray-200 text-gray-500`;
  };

  const getOptionIcon = (key) => {
    if (!revealed) return null;
    if (key === correctOption) return '✅';
    if (key === selected && key !== correctOption) return '❌';
    return null;
  };

  const difficultyColor = {
    easy: 'bg-green-100 text-green-700',
    medium: 'bg-yellow-100 text-yellow-700',
    hard: 'bg-red-100 text-red-700',
  }[question.difficulty] || 'bg-gray-100 text-gray-600';

  return (
    <div className="bg-white rounded-2xl shadow-md p-6 max-w-2xl w-full">
      {/* Progress & metadata bar */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-gray-500">
          Question {questionNumber} / {totalQuestions}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
            {question.category.name}
          </span>
          <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${difficultyColor}`}>
            {question.difficulty}
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-100 rounded-full h-1.5 mb-6">
        <div
          className="bg-indigo-500 h-1.5 rounded-full transition-all"
          style={{ width: `${(questionNumber / totalQuestions) * 100}%` }}
        />
      </div>

      {/* Question text */}
      <p className="text-lg font-semibold text-gray-900 mb-6 leading-snug">{question.text}</p>

      {/* Answer options */}
      <div className="space-y-3">
        {options.map(({ key, text }) => (
          <button
            key={key}
            onClick={() => !revealed && onSelect(key)}
            disabled={revealed}
            className={getOptionStyle(key)}
          >
            <span className="flex items-center justify-between">
              <span>
                <span className="font-bold mr-3 text-indigo-600">{key}.</span>
                {text}
              </span>
              {getOptionIcon(key) && (
                <span className="ml-2">{getOptionIcon(key)}</span>
              )}
            </span>
          </button>
        ))}
      </div>

      {/* Explanation (shown after reveal) */}
      {revealed && question.explanation && (
        <div className="mt-5 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
          <p className="text-sm text-blue-800">
            <span className="font-semibold">💡 Explanation: </span>
            {question.explanation}
          </p>
        </div>
      )}
    </div>
  );
}
