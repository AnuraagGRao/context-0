/**
 * Tests for the Quiz orchestrator component (setup → active → results flow).
 */
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import Quiz from '../components/Quiz'
import { quizApi } from '../api/client'

const mockNavigate = vi.hoisted(() => vi.fn())

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

vi.mock('../api/client', () => ({
  quizApi: {
    getCategories: vi.fn(),
    startQuiz: vi.fn(),
    submitQuiz: vi.fn(),
  },
}))

const categories = [{ id: 1, name: 'Science', icon: '🔬', description: 'Science' }]

const questions = [
  {
    id: 1,
    text: 'What is 2 + 2?',
    option_a: '3', option_b: '4', option_c: '5', option_d: '6',
    correct_option: 'B',
    difficulty: 'easy',
    explanation: '2 + 2 = 4.',
    category: { id: 1, name: 'Science', icon: '🔬' },
  },
  {
    id: 2,
    text: 'What colour is the sky?',
    option_a: 'Green', option_b: 'Red', option_c: 'Blue', option_d: 'Yellow',
    correct_option: 'C',
    difficulty: 'easy',
    explanation: 'The sky is blue.',
    category: { id: 1, name: 'Science', icon: '🔬' },
  },
]

const quizResult = {
  score: 2,
  total_questions: 2,
  accuracy: 1.0,
  results: questions.map((q) => ({
    question_id: q.id,
    selected_option: q.correct_option,
    correct_option: q.correct_option,
    is_correct: true,
    explanation: q.explanation,
  })),
}

function renderQuiz() {
  return render(
    <MemoryRouter>
      <Quiz />
    </MemoryRouter>
  )
}

describe('Quiz', () => {
  beforeEach(() => {
    vi.mocked(quizApi.getCategories).mockResolvedValue({ data: categories })
  })

  it('renders the setup screen with a Start Quiz button', async () => {
    renderQuiz()
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /start quiz/i })).toBeInTheDocument()
    )
    expect(screen.getByText('Start a Quiz')).toBeInTheDocument()
  })

  it('populates the category dropdown from the API', async () => {
    renderQuiz()
    await waitFor(() => expect(screen.getByText('🔬 Science')).toBeInTheDocument())
  })

  it('shows the first question after clicking Start', async () => {
    const user = userEvent.setup()
    vi.mocked(quizApi.startQuiz).mockResolvedValue({ data: questions })
    renderQuiz()

    await waitFor(() =>
      expect(screen.getByRole('button', { name: /start quiz/i })).toBeInTheDocument()
    )
    await user.click(screen.getByRole('button', { name: /start quiz/i }))

    await waitFor(() =>
      expect(screen.getByText('What is 2 + 2?')).toBeInTheDocument()
    )
    expect(screen.getByText('Question 1 / 2')).toBeInTheDocument()
  })

  it('advances to the next question after answering and clicking Next', async () => {
    const user = userEvent.setup()
    vi.mocked(quizApi.startQuiz).mockResolvedValue({ data: questions })
    renderQuiz()

    await waitFor(() =>
      expect(screen.getByRole('button', { name: /start quiz/i })).toBeInTheDocument()
    )
    await user.click(screen.getByRole('button', { name: /start quiz/i }))

    await waitFor(() => expect(screen.getByText('What is 2 + 2?')).toBeInTheDocument())

    // Select an answer to reveal the Next button
    await user.click(screen.getByText('4'))
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument()
    )
    await user.click(screen.getByRole('button', { name: /next/i }))

    await waitFor(() =>
      expect(screen.getByText('What colour is the sky?')).toBeInTheDocument()
    )
  })

  it('shows results after finishing the last question', async () => {
    const user = userEvent.setup()
    vi.mocked(quizApi.startQuiz).mockResolvedValue({ data: [questions[0]] })
    vi.mocked(quizApi.submitQuiz).mockResolvedValue({ data: { ...quizResult, total_questions: 1 } })
    renderQuiz()

    await waitFor(() =>
      expect(screen.getByRole('button', { name: /start quiz/i })).toBeInTheDocument()
    )
    await user.click(screen.getByRole('button', { name: /start quiz/i }))

    await waitFor(() => expect(screen.getByText('What is 2 + 2?')).toBeInTheDocument())

    await user.click(screen.getByText('4'))
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /finish quiz/i })).toBeInTheDocument()
    )
    await user.click(screen.getByRole('button', { name: /finish quiz/i }))

    await waitFor(() => expect(screen.getByText('Excellent!')).toBeInTheDocument())
  })
})
