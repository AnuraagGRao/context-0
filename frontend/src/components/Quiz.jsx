/**
 * Quiz – main orchestrator for a quiz session.
 *
 * State machine:
 *   setup  → user picks category / difficulty → clicks Start
 *   active → user answers questions one by one (with immediate feedback)
 *   submit → all questions answered, results are submitted to the backend
 *   results → QuizResults component is rendered
 *
 * Data flow:
 *   1. On mount:  GET /api/quiz/categories  → populate selectors
 *   2. On start:  POST /api/quiz/start      → receive questions[]
 *   3. Per answer: local state update + "Next" button reveal
 *   4. On finish: POST /api/quiz/submit     → receive QuizResult
 */
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { quizApi } from '../api/client';
import QuizQuestion from './QuizQuestion';
import QuizResults from './QuizResults';

const DIFFICULTIES = [
  { value: '', label: 'Any Difficulty' },
  { value: 'easy', label: '🟢 Easy' },
  { value: 'medium', label: '🟡 Medium' },
  { value: 'hard', label: '🔴 Hard' },
];

export default function Quiz() {
  const navigate = useNavigate();

  // ── State ──────────────────────────────────────────────────────────────────
  const [phase, setPhase] = useState('setup'); // 'setup' | 'active' | 'results'
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('');
  const [numQuestions, setNumQuestions] = useState(10);

  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({}); // { questionId: 'A'|'B'|'C'|'D' }
  const [revealed, setRevealed] = useState(false);

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // ── Load categories on mount ───────────────────────────────────────────────
  useEffect(() => {
    quizApi
      .getCategories()
      .then((res) => setCategories(res.data))
      .catch(() => setError('Could not load categories.'));
  }, []);

  // ── Start quiz ─────────────────────────────────────────────────────────────
  const handleStart = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await quizApi.startQuiz({
        category_id: selectedCategory ? Number(selectedCategory) : null,
        difficulty: selectedDifficulty || null,
        num_questions: numQuestions,
      });
      setQuestions(data);
      setCurrentIndex(0);
      setAnswers({});
      setRevealed(false);
      setPhase('active');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to start quiz.');
    } finally {
      setLoading(false);
    }
  };

  // ── Select an answer ───────────────────────────────────────────────────────
  const handleSelect = (optionKey) => {
    const qId = questions[currentIndex].id;
    setAnswers((prev) => ({ ...prev, [qId]: optionKey }));
    setRevealed(true); // immediately show feedback
  };

  // ── Advance to next question or finish ─────────────────────────────────────
  const handleNext = useCallback(async () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((i) => i + 1);
      setRevealed(false);
    } else {
      // All questions answered – submit
      setLoading(true);
      setError('');
      try {
        const payload = {
          category_id: selectedCategory ? Number(selectedCategory) : null,
          answers: Object.entries(answers).map(([question_id, selected_option]) => ({
            question_id: Number(question_id),
            selected_option,
          })),
        };
        const { data } = await quizApi.submitQuiz(payload);
        setResult(data);
        setPhase('results');
      } catch (err) {
        setError(err.response?.data?.detail || 'Failed to submit quiz.');
      } finally {
        setLoading(false);
      }
    }
  }, [currentIndex, questions, answers, selectedCategory]);

  const handleRetry = () => {
    setPhase('setup');
    setResult(null);
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  if (phase === 'results') {
    return (
      <div className="flex flex-col items-center px-4 py-10" style={{ minHeight: 'calc(100vh - 48px)' }}>
        <QuizResults
          result={result}
          onRetry={handleRetry}
          onDashboard={() => navigate('/dashboard')}
        />
      </div>
    );
  }

  if (phase === 'active') {
    const q = questions[currentIndex];
    const selectedForCurrent = answers[q.id] || null;
    const isLast = currentIndex === questions.length - 1;

    return (
      <div className="flex flex-col items-center px-4 py-10 gap-4" style={{ minHeight: 'calc(100vh - 48px)' }}>
        {error && (
          <p
            className="text-xs rounded-md px-3 py-2 w-full max-w-2xl"
            style={{
              background: 'var(--danger-dim)',
              color: 'var(--danger)',
              border: '1px solid rgba(229,72,77,0.25)',
            }}
          >
            {error}
          </p>
        )}

        <QuizQuestion
          question={q}
          selected={selectedForCurrent}
          onSelect={handleSelect}
          revealed={revealed}
          correctOption={q.correct_option}
          questionNumber={currentIndex + 1}
          totalQuestions={questions.length}
        />

        {revealed && (
          <button
            onClick={handleNext}
            disabled={loading}
            className="px-8 py-2 rounded-md text-sm font-semibold transition-all disabled:opacity-50"
            style={{ background: 'var(--accent)', color: '#fff' }}
            onMouseEnter={e => { if (!loading) e.target.style.background = 'var(--accent-hover)'; }}
            onMouseLeave={e => { e.target.style.background = 'var(--accent)'; }}
          >
            {loading ? 'Submitting…' : isLast ? 'Finish Quiz' : 'Next →'}
          </button>
        )}
      </div>
    );
  }

  // Setup screen
  return (
    <div
      className="flex flex-col items-center justify-center px-4 py-16"
      style={{ minHeight: 'calc(100vh - 48px)' }}
    >
      <div
        className="rounded-xl p-8 w-full max-w-md"
        style={{
          background: 'var(--bg-panel)',
          border: '1px solid var(--border-strong)',
        }}
      >
        <h2
          className="text-lg font-semibold tracking-tight mb-1"
          style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}
        >
          Start a Quiz
        </h2>
        <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
          Choose your category, difficulty and length
        </p>

        {error && (
          <p
            className="text-xs rounded-md px-3 py-2 mb-4"
            style={{
              background: 'var(--danger-dim)',
              color: 'var(--danger)',
              border: '1px solid rgba(229,72,77,0.25)',
            }}
          >
            {error}
          </p>
        )}

        <div className="space-y-4">
          {/* Category */}
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
              Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full rounded-md px-3 py-2 text-sm outline-none transition-all"
              style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-strong)',
                color: 'var(--text-primary)',
              }}
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.icon} {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Difficulty */}
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
              Difficulty
            </label>
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="w-full rounded-md px-3 py-2 text-sm outline-none transition-all"
              style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-strong)',
                color: 'var(--text-primary)',
              }}
            >
              {DIFFICULTIES.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>

          {/* Number of questions */}
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
              Questions
            </label>
            <input
              type="number"
              min={1}
              max={20}
              value={numQuestions}
              onChange={(e) => setNumQuestions(Number(e.target.value))}
              className="w-full rounded-md px-3 py-2 text-sm outline-none transition-all"
              style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-strong)',
                color: 'var(--text-primary)',
              }}
            />
          </div>

          <button
            onClick={handleStart}
            disabled={loading}
            className="w-full py-2 rounded-md text-sm font-semibold transition-all disabled:opacity-50 mt-2"
            style={{ background: 'var(--accent)', color: '#fff' }}
            onMouseEnter={e => { if (!loading) e.target.style.background = 'var(--accent-hover)'; }}
            onMouseLeave={e => { e.target.style.background = 'var(--accent)'; }}
          >
            {loading ? 'Loading…' : 'Start Quiz →'}
          </button>
        </div>
      </div>
    </div>
  );
}
