/**
 * Tests for QuizQuestion — a pure presentational component with no router/auth deps.
 */
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import QuizQuestion from '../components/QuizQuestion'

const question = {
  id: 1,
  text: 'What is 2 + 2?',
  option_a: '3',
  option_b: '4',
  option_c: '5',
  option_d: '6',
  correct_option: 'B',
  difficulty: 'easy',
  explanation: '2 + 2 equals 4.',
  category: { id: 1, name: 'Science', icon: '🔬' },
}

function renderQuestion(overrides = {}) {
  const props = {
    question,
    selected: null,
    onSelect: vi.fn(),
    revealed: false,
    correctOption: question.correct_option,
    questionNumber: 1,
    totalQuestions: 5,
    ...overrides,
  }
  return { ...render(<QuizQuestion {...props} />), onSelect: props.onSelect }
}

describe('QuizQuestion', () => {
  it('renders the question text and all four options', () => {
    renderQuestion()
    expect(screen.getByText('What is 2 + 2?')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByText('4')).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument()
    expect(screen.getByText('6')).toBeInTheDocument()
  })

  it('shows question progress counter', () => {
    renderQuestion()
    expect(screen.getByText('Question 1 / 5')).toBeInTheDocument()
  })

  it('calls onSelect with the chosen option key', async () => {
    const user = userEvent.setup()
    const { onSelect } = renderQuestion()
    await user.click(screen.getByText('4'))  // option B
    expect(onSelect).toHaveBeenCalledWith('B')
  })

  it('does not call onSelect again once revealed', async () => {
    const user = userEvent.setup()
    const { onSelect } = renderQuestion({ revealed: true, selected: 'A' })
    await user.click(screen.getByText('4'))
    expect(onSelect).not.toHaveBeenCalled()
  })

  it('shows the explanation after reveal', () => {
    renderQuestion({ revealed: true, selected: 'B' })
    expect(screen.getByText(/2 \+ 2 equals 4/i)).toBeInTheDocument()
  })

  it('displays the category name and difficulty badge', () => {
    renderQuestion()
    expect(screen.getByText('Science')).toBeInTheDocument()
    expect(screen.getByText('easy')).toBeInTheDocument()
  })
})
