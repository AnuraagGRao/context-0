/**
 * Tests for the Login form component.
 */
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import Login from '../components/Login'

const mockNavigate = vi.hoisted(() => vi.fn())
const mockLogin = vi.hoisted(() => vi.fn())

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ login: mockLogin }),
}))

function renderLogin() {
  return render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>
  )
}

describe('Login', () => {
  it('renders the app name and form fields', () => {
    renderLogin()
    expect(screen.getByText('Context0')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('your_username')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  it('navigates to /dashboard on successful login', async () => {
    const user = userEvent.setup()
    mockLogin.mockResolvedValueOnce({ username: 'testuser' })
    renderLogin()

    await user.type(screen.getByPlaceholderText('your_username'), 'testuser')
    await user.type(screen.getByPlaceholderText('••••••••'), 'Test1234')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/dashboard'))
  })

  it('shows an error message on failed login', async () => {
    const user = userEvent.setup()
    mockLogin.mockRejectedValueOnce({
      response: { data: { detail: 'Incorrect username or password.' } },
    })
    renderLogin()

    await user.type(screen.getByPlaceholderText('your_username'), 'bad')
    await user.type(screen.getByPlaceholderText('••••••••'), 'Bad00000')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() =>
      expect(screen.getByText('Incorrect username or password.')).toBeInTheDocument()
    )
  })

  it('links to the register page', () => {
    renderLogin()
    expect(screen.getByRole('link', { name: /register/i })).toHaveAttribute('href', '/register')
  })
})
