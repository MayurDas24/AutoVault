import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { QueryClient } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { AppRoutes } from './AppRoutes'
import { AppProviders } from './providers/AppProviders'

const TOKEN_KEY = 'autovault.token'
const PASSWORD = 'correct horse battery'

const customer = {
  id: '11111111-1111-4111-8111-111111111111',
  name: 'Casey Customer',
  email: 'casey@example.com',
  role: 'USER',
}
const admin = { ...customer, name: 'Alex Admin', email: 'alex@example.com', role: 'ADMIN' }

type FetchFn = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>
const fetchMock = vi.fn<FetchFn>()

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

/** Routes are keyed "METHOD /path". Unlisted requests receive a 404. */
function mockApi(routes: Record<string, () => Response>) {
  fetchMock.mockImplementation((input, init) => {
    const method = init?.method ?? 'GET'
    const path = new URL(String(input)).pathname
    const handler = routes[`${method} ${path}`]

    return Promise.resolve(
      handler
        ? handler()
        : json({ error: { code: 'NOT_FOUND', message: 'Route not found' } }, 404),
    )
  })
}

function callsTo(method: string, path: string) {
  return fetchMock.mock.calls.filter(
    ([input, init]) =>
      (init?.method ?? 'GET') === method && new URL(String(input)).pathname === path,
  )
}

function renderApp(path: string) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })

  return render(
    <AppProviders queryClient={queryClient}>
      <MemoryRouter initialEntries={[path]}>
        <AppRoutes />
      </MemoryRouter>
    </AppProviders>,
  )
}

function type(label: string, value: string) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } })
}

describe('AutoVault routing, sign-in and access control', () => {
  beforeEach(() => {
    window.localStorage.clear()
    fetchMock.mockReset()
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
  })

  it('sends signed-out visitors to the sign-in page without calling the API', async () => {
    renderApp('/inventory')

    expect(await screen.findByRole('heading', { level: 1, name: 'Sign in' })).toBeDefined()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('validates the sign-in form before sending anything', async () => {
    renderApp('/login')

    fireEvent.click(await screen.findByRole('button', { name: 'Sign in' }))

    expect(await screen.findByText('Enter your email address.')).toBeDefined()
    expect(screen.getByText('Enter your password.')).toBeDefined()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('signs in, stores only the token and opens the dashboard', async () => {
    mockApi({ 'POST /api/auth/login': () => json({ token: 'test-token', user: customer }) })
    renderApp('/login')

    await screen.findByRole('heading', { level: 1, name: 'Sign in' })
    type('Email', 'casey@example.com')
    type('Password', PASSWORD)
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }))

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Inventory Overview' }),
    ).toBeDefined()
    expect(window.localStorage.getItem(TOKEN_KEY)).toBe('test-token')

    const [call] = callsTo('POST', '/api/auth/login')
    expect(JSON.parse(String(call?.[1]?.body))).toEqual({
      email: 'casey@example.com',
      password: PASSWORD,
    })
  })

  it('shows the server error for bad credentials and stores no token', async () => {
    mockApi({
      'POST /api/auth/login': () =>
        json({ error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' } }, 401),
    })
    renderApp('/login')

    await screen.findByRole('heading', { level: 1, name: 'Sign in' })
    type('Email', 'casey@example.com')
    type('Password', 'wrong password!')
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }))

    expect(await screen.findByText('Invalid email or password')).toBeDefined()
    expect(window.localStorage.getItem(TOKEN_KEY)).toBeNull()
    expect(screen.getByRole('heading', { level: 1, name: 'Sign in' })).toBeDefined()
  })

  it('restores a saved session by asking the server and sends the bearer token', async () => {
    window.localStorage.setItem(TOKEN_KEY, 'saved-token')
    mockApi({ 'GET /api/auth/me': () => json({ user: customer }) })
    renderApp('/')

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Inventory Overview' }),
    ).toBeDefined()

    const [call] = callsTo('GET', '/api/auth/me')
    const headers = (call?.[1]?.headers ?? {}) as Record<string, string>
    expect(headers['Authorization']).toBe('Bearer saved-token')
  })

  it('clears an expired saved session and returns to sign in', async () => {
    window.localStorage.setItem(TOKEN_KEY, 'expired-token')
    mockApi({
      'GET /api/auth/me': () =>
        json(
          { error: { code: 'UNAUTHORIZED', message: 'Invalid or expired authentication token' } },
          401,
        ),
    })
    renderApp('/inventory')

    expect(
      await screen.findByText('Your session has expired. Please sign in again.'),
    ).toBeDefined()
    expect(window.localStorage.getItem(TOKEN_KEY)).toBeNull()
    expect(screen.getByRole('heading', { level: 1, name: 'Sign in' })).toBeDefined()
  })

  it('hides administration from customers and blocks the page', async () => {
    window.localStorage.setItem(TOKEN_KEY, 'customer-token')
    mockApi({ 'GET /api/auth/me': () => json({ user: customer }) })
    renderApp('/admin')

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Administrator access required' }),
    ).toBeDefined()

    const nav = within(screen.getByRole('navigation', { name: 'Primary' }))
    expect(nav.queryByRole('link', { name: 'Administration' })).toBeNull()
  })

  it('shows administration to administrators', async () => {
    window.localStorage.setItem(TOKEN_KEY, 'admin-token')
    mockApi({ 'GET /api/auth/me': () => json({ user: admin }) })
    renderApp('/admin')

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Administration' }),
    ).toBeDefined()

    const nav = within(screen.getByRole('navigation', { name: 'Primary' }))
    expect(nav.getByRole('link', { name: 'Administration' })).toBeDefined()
  })

  it('registers without ever sending a role, then returns to sign in', async () => {
    mockApi({ 'POST /api/auth/register': () => json({ user: customer }, 201) })
    renderApp('/register')

    await screen.findByRole('heading', { level: 1, name: 'Create your account' })
    type('Full name', 'Casey Customer')
    type('Email', 'casey@example.com')
    type('Password', PASSWORD)
    type('Confirm password', PASSWORD)
    fireEvent.click(screen.getByRole('button', { name: 'Create account' }))

    expect(await screen.findByRole('heading', { level: 1, name: 'Sign in' })).toBeDefined()
    expect(screen.getByText('Account created. Sign in to continue.')).toBeDefined()

    const [call] = callsTo('POST', '/api/auth/register')
    const body = JSON.parse(String(call?.[1]?.body)) as Record<string, unknown>
    expect(Object.keys(body).sort()).toEqual(['email', 'name', 'password'])
  })

  it('rejects mismatched passwords before calling the API', async () => {
    renderApp('/register')

    await screen.findByRole('heading', { level: 1, name: 'Create your account' })
    type('Full name', 'Casey Customer')
    type('Email', 'casey@example.com')
    type('Password', PASSWORD)
    type('Confirm password', 'a different password')
    fireEvent.click(screen.getByRole('button', { name: 'Create account' }))

    expect(await screen.findByText('Passwords do not match.')).toBeDefined()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('renders a not found page for unknown routes when signed in', async () => {
    window.localStorage.setItem(TOKEN_KEY, 'customer-token')
    mockApi({ 'GET /api/auth/me': () => json({ user: customer }) })
    renderApp('/does-not-exist')

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Page not found' }),
    ).toBeDefined()
  })
})