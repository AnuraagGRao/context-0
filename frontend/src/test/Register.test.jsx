/**
 * Tests for the Register form component.
 */
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import Register from '../components/Register'

const mockNavigate = vi.hoisted(() => vi.fn())
const mockRegister = vi.hoisted(() => vi.fn())

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ register: mockRegister }),
}))

function renderRegister() {
  return render(
    <MemoryRouter>
      <Register />
    </MemoryRouter>
  )
}

describe('Register', () => {
  it('renders the app name and all form fields', () => {
    renderRegister()
    expect(screen.getByText('Context0')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('choose_a_username')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('min. 8 characters')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument()
  })

  it('enforces minLength=8 on the password field', () => {
    renderRegister()
    const pwdInput = screen.getByPlaceholderText('min. 8 characters')
    expect(pwdInput).toHaveAttribute('minLength', '8')
  })

  it('navigates to /dashboard after successful registration', async () => {
    const user = userEvent.setup()
    mockRegister.mockResolvedValueOnce({ username: 'newuser' })
    renderRegister()

    await user.type(screen.getByPlaceholderText('choose_a_username'), 'newuser')
    await user.type(screen.getByPlaceholderText('you@example.com'), 'new@example.com')
    await user.type(screen.getByPlaceholderText('min. 8 characters'), 'Password1')
    await user.click(screen.getByRole('button', { name: /create account/i }))

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/dashboard'))
  })

  it('shows an error message when registration fails', async () => {
    const user = userEvent.setup()
    mockRegister.mockRejectedValueOnce({
      response: { data: { detail: 'Username or email already registered.' } },
    })
    renderRegister()

    await user.type(screen.getByPlaceholderText('choose_a_username'), 'dup')
    await user.type(screen.getByPlaceholderText('you@example.com'), 'dup@example.com')
    await user.type(screen.getByPlaceholderText('min. 8 characters'), 'Password1')
    await user.click(screen.getByRole('button', { name: /create account/i }))

    await waitFor(() =>
      expect(screen.getByText('Username or email already registered.')).toBeInTheDocument()
    )
  })
})
