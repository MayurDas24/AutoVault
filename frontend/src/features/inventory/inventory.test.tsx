import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { AppRoutes } from '../../AppRoutes'
import { AppProviders } from '../../providers/AppProviders'

const TOKEN_KEY = 'autovault.token'

const customer = {
  id: '11111111-1111-4111-8111-111111111111',
  name: 'Casey Customer',
  email: 'casey@example.com',
  role: 'USER',
}

const xc60 = {
  id: '22222222-2222-4222-8222-222222222222',
  make: 'Volvo',
  model: 'XC60',
  category: 'SUV',
  price: '45999.00',
  quantity: 8,
  createdAt: '2026-01-10T09:00:00.000Z',
  updatedAt: '2026-01-12T09:00:00.000Z',
}

type Vehicle = typeof xc60
type FetchFn = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>
type Handler = (url: URL) => Response

const fetchMock = vi.fn<FetchFn>()

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function apiError(status: number, code: string, message: string): Response {
  return json({ error: { code, message } }, status)
}

function listOf(vehicles: Vehicle[]) {
  return {
    vehicles,
    pagination: {
      page: 1,
      limit: 10,
      total: vehicles.length,
      totalPages: Math.max(1, Math.ceil(vehicles.length / 10)),
    },
  }
}

/** Routes are keyed "METHOD /path". The signed-in user lookup is always mocked. */
function mockApi(routes: Record<string, Handler>) {
  const all: Record<string, Handler> = {
    'GET /api/auth/me': () => json({ user: customer }),
    ...routes,
  }

  fetchMock.mockImplementation((input, init) => {
    const url = new URL(String(input))
    const handler = all[`${init?.method ?? 'GET'} ${url.pathname}`]

    return Promise.resolve(handler ? handler(url) : apiError(404, 'NOT_FOUND', 'Route not found'))
  })
}

function callsTo(method: string, path: string) {
  return fetchMock.mock.calls
    .filter(
      ([input, init]) =>
        (init?.method ?? 'GET') === method && new URL(String(input)).pathname === path,
    )
    .map(([input, init]) => ({ url: new URL(String(input)), init }))
}

function renderAt(path: string) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })

  return render(
    <AppProviders queryClient={queryClient}>
      <MemoryRouter initialEntries={[path]}>
        <AppRoutes />
      </MemoryRouter>
    </AppProviders>,
  )
}

describe('inventory', () => {
  beforeEach(() => {
    window.localStorage.setItem(TOKEN_KEY, 'customer-token')
    fetchMock.mockReset()
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    cleanup()
    window.localStorage.clear()
    vi.unstubAllGlobals()
  })

  it('loads vehicles from the API using the bearer token', async () => {
    mockApi({ 'GET /api/vehicles': () => json(listOf([xc60])) })
    renderAt('/inventory')

    expect(await screen.findByRole('link', { name: 'Volvo XC60' })).toBeDefined()
    expect(screen.getByText('$45,999.00')).toBeDefined()
    expect(screen.getByText('In stock')).toBeDefined()

    const [call] = callsTo('GET', '/api/vehicles')
    const headers = (call?.init?.headers ?? {}) as Record<string, string>
    expect(headers['Authorization']).toBe('Bearer customer-token')
    expect(call?.url.searchParams.get('limit')).toBe('10')
  })

  it('shows an empty state when the inventory has no vehicles', async () => {
    mockApi({ 'GET /api/vehicles': () => json(listOf([])) })
    renderAt('/inventory')

    expect(await screen.findByText('No vehicles in inventory yet')).toBeDefined()
  })

  it('shows an error with a retry action and recovers', async () => {
    let attempts = 0
    mockApi({
      'GET /api/vehicles': () => {
        attempts += 1
        return attempts === 1
          ? apiError(500, 'INTERNAL_ERROR', 'An unexpected error occurred')
          : json(listOf([xc60]))
      },
    })
    renderAt('/inventory')

    expect(await screen.findByText('An unexpected error occurred')).toBeDefined()
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))

    expect(await screen.findByRole('link', { name: 'Volvo XC60' })).toBeDefined()
  })

  it('sends search, category and price filters to the search endpoint', async () => {
    mockApi({
      'GET /api/vehicles': () => json(listOf([xc60])),
      'GET /api/vehicles/search': () => json(listOf([xc60])),
    })
    renderAt('/inventory')

    await screen.findByRole('link', { name: 'Volvo XC60' })
    fireEvent.change(screen.getByLabelText('Search vehicles'), { target: { value: 'volvo' } })
    fireEvent.change(screen.getByLabelText('Category'), { target: { value: 'SUV' } })
    fireEvent.change(screen.getByLabelText('Min price'), { target: { value: '30000' } })
    fireEvent.change(screen.getByLabelText('Max price'), { target: { value: '60000' } })
    fireEvent.click(screen.getByLabelText('In stock only'))
    fireEvent.click(screen.getByRole('button', { name: 'Apply filters' }))

    await waitFor(() => expect(callsTo('GET', '/api/vehicles/search').length).toBeGreaterThan(0))

    const [call] = callsTo('GET', '/api/vehicles/search')
    expect(call?.url.searchParams.get('q')).toBe('volvo')
    expect(call?.url.searchParams.get('category')).toBe('SUV')
    expect(call?.url.searchParams.get('minPrice')).toBe('30000')
    expect(call?.url.searchParams.get('maxPrice')).toBe('60000')
    expect(call?.url.searchParams.get('inStock')).toBe('true')
  })

  it('rejects an inverted price range without calling the search endpoint', async () => {
    mockApi({ 'GET /api/vehicles': () => json(listOf([xc60])) })
    renderAt('/inventory')

    await screen.findByRole('link', { name: 'Volvo XC60' })
    fireEvent.change(screen.getByLabelText('Min price'), { target: { value: '50000' } })
    fireEvent.change(screen.getByLabelText('Max price'), { target: { value: '30000' } })
    fireEvent.click(screen.getByRole('button', { name: 'Apply filters' }))

    expect(await screen.findByText('Minimum price cannot exceed maximum price.')).toBeDefined()
    expect(callsTo('GET', '/api/vehicles/search')).toHaveLength(0)
  })

  it('shows a no-matches state when filters return nothing', async () => {
    mockApi({
      'GET /api/vehicles': () => json(listOf([xc60])),
      'GET /api/vehicles/search': () => json(listOf([])),
    })
    renderAt('/inventory')

    await screen.findByRole('link', { name: 'Volvo XC60' })
    fireEvent.change(screen.getByLabelText('Search vehicles'), { target: { value: 'zzz' } })
    fireEvent.click(screen.getByRole('button', { name: 'Apply filters' }))

    expect(await screen.findByText('No vehicles match your filters')).toBeDefined()
  })
})

describe('vehicle details and purchase', () => {
  const detailPath = `/api/vehicles/${xc60.id}`
  const low: Vehicle = { ...xc60, quantity: 3 }

  beforeEach(() => {
    window.localStorage.setItem(TOKEN_KEY, 'customer-token')
    fetchMock.mockReset()
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    cleanup()
    window.localStorage.clear()
    vi.unstubAllGlobals()
  })

  it('purchases a vehicle and shows the stock returned by the server', async () => {
    mockApi({
      [`GET ${detailPath}`]: () => json({ vehicle: low }),
      [`POST ${detailPath}/purchase`]: () =>
        json({ message: 'Vehicle purchased successfully', vehicle: { ...low, quantity: 2 } }),
    })
    renderAt(`/inventory/${xc60.id}`)

    expect(await screen.findByRole('heading', { level: 1, name: 'Volvo XC60' })).toBeDefined()
    expect(screen.getByText('3 units')).toBeDefined()

    fireEvent.click(screen.getByRole('button', { name: 'Purchase vehicle' }))

    expect(await screen.findByText('Vehicle purchased successfully')).toBeDefined()
    expect(await screen.findByText('2 units')).toBeDefined()
    expect(callsTo('POST', `${detailPath}/purchase`)).toHaveLength(1)
  })

  it('disables purchase when the vehicle is sold out', async () => {
    mockApi({ [`GET ${detailPath}`]: () => json({ vehicle: { ...xc60, quantity: 0 } }) })
    renderAt(`/inventory/${xc60.id}`)

    await screen.findByRole('heading', { level: 1, name: 'Volvo XC60' })
    const button = screen.getByRole('button', { name: 'Purchase vehicle' }) as HTMLButtonElement

    expect(button.disabled).toBe(true)
    expect(screen.getByText('Out of stock')).toBeDefined()
  })

  it('shows the server message when a purchase is rejected', async () => {
    mockApi({
      [`GET ${detailPath}`]: () => json({ vehicle: { ...xc60, quantity: 1 } }),
      [`POST ${detailPath}/purchase`]: () =>
        apiError(409, 'OUT_OF_STOCK', 'Insufficient inventory to complete this purchase'),
    })
    renderAt(`/inventory/${xc60.id}`)

    await screen.findByRole('heading', { level: 1, name: 'Volvo XC60' })
    fireEvent.click(screen.getByRole('button', { name: 'Purchase vehicle' }))

    expect(
      await screen.findByText('Insufficient inventory to complete this purchase'),
    ).toBeDefined()
  })

  it('shows a not found state for an unknown vehicle', async () => {
    mockApi({
      [`GET ${detailPath}`]: () => apiError(404, 'VEHICLE_NOT_FOUND', 'Vehicle not found'),
    })
    renderAt(`/inventory/${xc60.id}`)

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Vehicle not found' }),
    ).toBeDefined()
  })
}) 