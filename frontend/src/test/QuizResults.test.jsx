/**
 * Tests for QuizResults — a pure presentational component with no router/auth deps.
 */
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import QuizResults from '../components/QuizResults'

const perfectResult = {
  score: 10,
  total_questions: 10,
  accuracy: 1.0,
  results: [
    {
      question_id: 1,
      selected_option: 'B',
      correct_option: 'B',
      is_correct: true,
      explanation: 'Because 2+2=4.',
    },
  ],
}

const poorResult = {
  score: 2,
  total_questions: 10,
  accuracy: 0.2,
  results: [
    {
      question_id: 1,
      selected_option: 'A',
      correct_option: 'B',
      is_correct: false,
      explanation: 'The correct answer is B.',
    },
  ],
}

describe('QuizResults', () => {
  it('renders the score and percentage', () => {
    render(<QuizResults result={perfectResult} onRetry={vi.fn()} onDashboard={vi.fn()} />)
    expect(screen.getByText(/10 \/ 10/)).toBeInTheDocument()
    expect(screen.getByText(/100%/)).toBeInTheDocument()
  })

  it('shows Excellent grade label for >= 80%', () => {
    render(<QuizResults result={perfectResult} onRetry={vi.fn()} onDashboard={vi.fn()} />)
    expect(screen.getByText('Excellent!')).toBeInTheDocument()
  })

  it('shows Keep Practising label for < 60%', () => {
    render(<QuizResults result={poorResult} onRetry={vi.fn()} onDashboard={vi.fn()} />)
    expect(screen.getByText('Keep Practising!')).toBeInTheDocument()
  })

  it('calls onRetry when New Quiz button is clicked', async () => {
    const user = userEvent.setup()
    const onRetry = vi.fn()
    render(<QuizResults result={perfectResult} onRetry={onRetry} onDashboard={vi.fn()} />)
    await user.click(screen.getByRole('button', { name: /new quiz/i }))
    expect(onRetry).toHaveBeenCalledOnce()
  })

  it('calls onDashboard when Dashboard button is clicked', async () => {
    const user = userEvent.setup()
    const onDashboard = vi.fn()
    render(<QuizResults result={perfectResult} onRetry={vi.fn()} onDashboard={onDashboard} />)
    await user.click(screen.getByRole('button', { name: /dashboard/i }))
    expect(onDashboard).toHaveBeenCalledOnce()
  })

  it('renders explanation text for each question', () => {
    render(<QuizResults result={poorResult} onRetry={vi.fn()} onDashboard={vi.fn()} />)
    expect(screen.getByText(/The correct answer is B/)).toBeInTheDocument()
  })
})
