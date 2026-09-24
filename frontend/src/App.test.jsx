import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import App from './App'
import { AuthProvider } from './AuthContext'
import { api } from './api'

vi.mock('./api', () => ({
  api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
  clearSession: () => { localStorage.removeItem('qa_access_token'); localStorage.removeItem('qa_user') },
  storeSession: (auth) => { localStorage.setItem('qa_access_token', auth.token); localStorage.setItem('qa_user', JSON.stringify({ username: auth.username, role: auth.role })) },
}))

const bug = {
  id: 7, title: 'Login fails', description: 'Authentication breaks', project: 'Portal', environment: 'QA',
  stepsToReproduce: 'Open login', expectedResult: 'Dashboard opens', actualResult: 'Error appears',
  severity: 'HIGH', priority: 'HIGH', status: 'OPEN', assignee: 'alice', reporter: 'tester',
  createdAt: '2026-09-24T10:00:00', updatedAt: '2026-09-24T10:00:00',
}

function renderApp(path = '/bugs', role = 'TESTER') {
  localStorage.setItem('qa_access_token', 'token')
  localStorage.setItem('qa_user', JSON.stringify({ username: 'qa-user', role }))
  return render(<MemoryRouter initialEntries={[path]}><AuthProvider><App /></AuthProvider></MemoryRouter>)
}

describe('bug management UI', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
    api.get.mockResolvedValue({ data: { content: [bug], totalPages: 2, totalElements: 9, number: 0 } })
  })
  afterEach(() => cleanup())

  it('loads and renders the bug list, filters, and pagination', async () => {
    renderApp()
    expect(await screen.findByText('Login fails')).toBeInTheDocument()
    expect(api.get).toHaveBeenCalledWith('/bugs', expect.objectContaining({ params: expect.objectContaining({ page: 0, size: 8 }) }))
    fireEvent.change(screen.getByPlaceholderText('Search title or description...'), { target: { value: 'login' } })
    fireEvent.change(screen.getAllByRole('combobox')[0], { target: { name: 'status', value: 'OPEN' } })
    expect(await screen.findByText('Page 1 of 2')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Next →' }))
    await waitFor(() => expect(api.get).toHaveBeenLastCalledWith('/bugs', expect.objectContaining({ params: expect.objectContaining({ page: 1, status: 'OPEN', search: 'login' }) })))
  })

  it('submits a new bug and shows role-aware detail controls', async () => {
    api.post.mockResolvedValue({ data: { id: 8 } })
    renderApp('/bugs/new')
    fireEvent.change(screen.getByLabelText(/Title/), { target: { value: 'New issue' } })
    fireEvent.change(screen.getByLabelText(/Project/), { target: { value: 'Portal' } })
    fireEvent.change(screen.getByLabelText(/Environment/), { target: { value: 'QA' } })
    fireEvent.change(screen.getByLabelText(/Reporter/), { target: { value: 'tester' } })
    fireEvent.change(screen.getByLabelText(/Assignee/), { target: { value: 'alice' } })
    fireEvent.change(screen.getByLabelText(/Description/), { target: { value: 'Details' } })
    fireEvent.change(screen.getByLabelText(/Steps to reproduce/), { target: { value: 'Step one' } })
    fireEvent.change(screen.getByLabelText(/Expected result/), { target: { value: 'Expected' } })
    fireEvent.change(screen.getByLabelText(/Actual result/), { target: { value: 'Actual' } })
    fireEvent.click(screen.getByRole('button', { name: 'Create bug' }))
    await waitFor(() => expect(api.post).toHaveBeenCalledWith('/bugs', expect.objectContaining({ title: 'New issue', project: 'Portal' })))

    cleanup()
    api.get.mockResolvedValue({ data: bug })
    renderApp('/bugs/7', 'TESTER')
    expect(await screen.findByText('Login fails')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Delete' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Edit bug' })).not.toBeInTheDocument()
  })

  it('shows edit and delete controls for admins', async () => {
    api.get.mockResolvedValue({ data: bug })
    renderApp('/bugs/7', 'ADMIN')
    expect(await screen.findByRole('link', { name: 'Edit bug' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument()
  })

  it('shows loading and API error states', async () => {
    let resolveRequest
    api.get.mockReturnValue(new Promise((resolve) => { resolveRequest = resolve }))
    renderApp()
    expect(screen.getByText('Loading your bug queue...')).toBeInTheDocument()
    resolveRequest({ data: { content: [], totalPages: 1, totalElements: 0, number: 0 } })
    await waitFor(() => expect(screen.getByText('No bugs match these filters.')).toBeInTheDocument())

    cleanup()
    api.get.mockRejectedValue(new Error('network'))
    renderApp()
    expect(await screen.findByText('Could not load bugs. Is the Spring Boot API running?')).toBeInTheDocument()
  })
})
