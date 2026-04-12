/**
 * Tests for the Dashboard component.
 */
import { render, screen, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import Dashboard from '../components/Dashboard'
import { progressApi } from '../api/client'

const mockUseAuth = vi.hoisted(() => vi.fn())

vi.mock('../context/AuthContext', () => ({ useAuth: mockUseAuth }))

vi.mock('../api/client', () => ({
  progressApi: { getStats: vi.fn() },
}))

const emptyStats = {
  total_quizzes: 0,
  overall_accuracy: 0,
  current_streak: 0,
  weak_subjects: [],
  recent_activity: [],
}

const fullStats = {
  total_quizzes: 7,
  overall_accuracy: 0.85,
  current_streak: 3,
  weak_subjects: [
    { category_id: 2, category_name: 'History', average_accuracy: 0.4, attempts: 2 },
  ],
  recent_activity: [
    {
      id: 1,
      category_id: 1,
      category_name: 'Science',
      score: 8,
      total_questions: 10,
      accuracy: 0.8,
      quiz_date: new Date().toISOString(),
      current_streak: 3,
    },
  ],
}

function renderDashboard() {
  return render(
    <MemoryRouter>
      <Dashboard />
    </MemoryRouter>
  )
}

describe('Dashboard', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({ user: { username: 'testuser' }, loading: false })
  })

  it('shows a loading indicator while fetching stats', () => {
    vi.mocked(progressApi.getStats).mockReturnValue(new Promise(() => {}))
    renderDashboard()
    expect(screen.getByText(/loading your stats/i)).toBeInTheDocument()
  })

  it('shows the welcome message with the username', async () => {
    vi.mocked(progressApi.getStats).mockResolvedValue({ data: emptyStats })
    renderDashboard()
    await waitFor(() =>
      expect(screen.getByText(/welcome back, testuser/i)).toBeInTheDocument()
    )
  })

  it('renders stat cards with the correct values', async () => {
    vi.mocked(progressApi.getStats).mockResolvedValue({ data: fullStats })
    renderDashboard()
    await waitFor(() => {
      expect(screen.getByText('7')).toBeInTheDocument()     // total quizzes
      expect(screen.getByText('85%')).toBeInTheDocument()   // accuracy
      expect(screen.getByText('3')).toBeInTheDocument()     // streak
    })
  })

  it('renders weak subjects section when accuracy < 60%', async () => {
    vi.mocked(progressApi.getStats).mockResolvedValue({ data: fullStats })
    renderDashboard()
    await waitFor(() =>
      expect(screen.getByText('History')).toBeInTheDocument()
    )
  })

  it('shows empty activity message when no quizzes taken yet', async () => {
    vi.mocked(progressApi.getStats).mockResolvedValue({ data: emptyStats })
    renderDashboard()
    await waitFor(() =>
      expect(screen.getByText(/no quiz activity yet/i)).toBeInTheDocument()
    )
  })

  it('shows an error message when stats fetch fails', async () => {
    vi.mocked(progressApi.getStats).mockRejectedValue(new Error('Network error'))
    renderDashboard()
    await waitFor(() =>
      expect(screen.getByText(/could not load your stats/i)).toBeInTheDocument()
    )
  })
})
