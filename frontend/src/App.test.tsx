import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import App from './App'

type FetchFn = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>

describe('App', () => {
  const fetchMock = vi.fn<FetchFn>()

  beforeEach(() => {
    window.localStorage.clear()
    fetchMock.mockReset()
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
    window.history.pushState({}, '', '/')
  })

  it('owns its router and shows sign-in to a signed-out visitor', async () => {
    window.history.pushState({}, '', '/')
    render(<App />)

    expect(await screen.findByRole('heading', { level: 1, name: 'Sign in' })).toBeDefined()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('redirects a protected deep link to sign-in', async () => {
    window.history.pushState({}, '', '/does-not-exist')
    render(<App />)

    expect(await screen.findByRole('heading', { level: 1, name: 'Sign in' })).toBeDefined()
  })
})