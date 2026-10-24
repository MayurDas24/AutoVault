import { createElement } from 'react'
import { vi } from 'vitest'
import { render } from '@testing-library/react'
import { QueryClient } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { AppRoutes } from '../AppRoutes'
import { AppProviders } from '../providers/AppProviders'

export const TOKEN_KEY = 'autovault.token'

export interface TestUser {
  id: string
  name: string
  email: string
  role: 'USER' | 'ADMIN'
}

export const customer: TestUser = {
  id: '11111111-1111-4111-8111-111111111111',
  name: 'Casey Customer',
  email: 'casey@example.com',
  role: 'USER',
}

export const admin: TestUser = {
  ...customer,
  name: 'Alex Admin',
  email: 'alex@example.com',
  role: 'ADMIN',
}

export interface TestVehicle {
  id: string
  make: string
  model: string
  category: string
  price: string
  quantity: number
  createdAt: string
  updatedAt: string
}

export const xc60: TestVehicle = {
  id: '22222222-2222-4222-8222-222222222222',
  make: 'Volvo',
  model: 'XC60',
  category: 'SUV',
  price: '45999.00',
  quantity: 8,
  createdAt: '2026-01-10T09:00:00.000Z',
  updatedAt: '2026-01-12T09:00:00.000Z',
}

export type Handler = (url: URL) => Response
type FetchFn = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>

export const fetchMock = vi.fn<FetchFn>()

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

export function apiError(status: number, code: string, message: string): Response {
  return json({ error: { code, message } }, status)
}

export function listOf(vehicles: TestVehicle[]) {
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

export function installFetch(token = 'test-token'): void {
  window.localStorage.setItem(TOKEN_KEY, token)
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
}

export function uninstallFetch(): void {
  window.localStorage.clear()
  vi.unstubAllGlobals()
}

/** Routes are keyed "METHOD /path". The signed-in user lookup is always mocked. */
export function mockApi(user: TestUser, routes: Record<string, Handler>): void {
  const all: Record<string, Handler> = {
    'GET /api/auth/me': () => json({ user }),
    ...routes,
  }

  fetchMock.mockImplementation((input, init) => {
    const url = new URL(String(input))
    const handler = all[`${init?.method ?? 'GET'} ${url.pathname}`]

    return Promise.resolve(handler ? handler(url) : apiError(404, 'NOT_FOUND', 'Route not found'))
  })
}

export function callsTo(method: string, path: string) {
  return fetchMock.mock.calls
    .filter(
      ([input, init]) =>
        (init?.method ?? 'GET') === method && new URL(String(input)).pathname === path,
    )
    .map(([input, init]) => ({ url: new URL(String(input)), init }))
}

export function bodyOf(call: { init?: RequestInit } | undefined): unknown {
  return JSON.parse(String(call?.init?.body))
}

export function renderApp(path: string) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })

  return render(
    createElement(AppProviders, {
      queryClient,
      children: createElement(
        MemoryRouter,
        { initialEntries: [path] },
        createElement(AppRoutes),
      ),
    }),
  )
}