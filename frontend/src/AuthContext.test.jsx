import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import App from './App'
import { AuthProvider } from './AuthContext'
import { api } from './api'

vi.mock('./api', () => ({
  api: { post: vi.fn(), get: vi.fn() },
  clearSession: () => { localStorage.removeItem('qa_access_token'); localStorage.removeItem('qa_user') },
  storeSession: (auth) => { localStorage.setItem('qa_access_token', auth.token); localStorage.setItem('qa_user', JSON.stringify({ username: auth.username, role: auth.role })) },
}))

function renderApp(initialEntries = ['/']) {
  return render(<MemoryRouter initialEntries={initialEntries}><AuthProvider><App /></AuthProvider></MemoryRouter>)
}

describe('authentication flow', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
    api.get.mockResolvedValue({ data: { content: [], totalPages: 1, totalElements: 0, number: 0 } })
  })
  afterEach(() => cleanup())

  it('redirects anonymous users to login', () => {
    renderApp()
    expect(screen.getByText('Sign in to Quality Desk')).toBeInTheDocument()
  })

  it('logs in, stores the session, and shows the dashboard', async () => {
    api.post.mockResolvedValue({ data: { token: 'jwt-token', username: 'alice', role: 'TESTER' } })
    renderApp(['/login'])
    fireEvent.change(screen.getByLabelText(/Username/), { target: { value: 'alice' } })
    fireEvent.change(screen.getByLabelText(/Password/), { target: { value: 'password123' } })
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }))
    await waitFor(() => expect(screen.getByText('Good testing starts with visibility.')).toBeInTheDocument())
    expect(localStorage.getItem('qa_access_token')).toBe('jwt-token')
  })

  it('logs out and returns to login', async () => {
    localStorage.setItem('qa_user', JSON.stringify({ username: 'alice', role: 'TESTER' }))
    localStorage.setItem('qa_access_token', 'jwt-token')
    api.post.mockResolvedValue({ data: {} })
    renderApp()
    fireEvent.click(screen.getByRole('button', { name: 'Log out' }))
    await waitFor(() => expect(screen.getByText('Sign in to Quality Desk')).toBeInTheDocument())
  })
})
