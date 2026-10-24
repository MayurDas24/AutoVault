import { clearToken, getToken } from '../session'
import { ApiError } from './errors'

const DEFAULT_API_URL = 'http://127.0.0.1:5000'

function normalizeBaseUrl(value: unknown): string {
  const trimmed = typeof value === 'string' ? value.trim() : ''
  return (trimmed || DEFAULT_API_URL).replace(/\/+$/, '')
}

/** Configured through VITE_API_URL (see .env.example). */
export const API_URL = normalizeBaseUrl(import.meta.env.VITE_API_URL)

type QueryValue = string | number | boolean | null | undefined
export type QueryParams = Record<string, QueryValue>

export interface RequestOptions<T> {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  query?: QueryParams
  body?: unknown
  /** Attach the saved bearer token. Defaults to true. */
  authenticated?: boolean
  signal?: AbortSignal
  /** Validates and converts the JSON payload; see parsers.ts. */
  parse: (payload: unknown) => T
}

let unauthorizedHandler: (() => void) | null = null

/**
 * Called when the API rejects a saved token (401). The AuthProvider registers
 * a handler so the UI can return to the sign-in screen.
 */
export function setUnauthorizedHandler(handler: (() => void) | null): void {
  unauthorizedHandler = handler
}

function buildUrl(path: string, query?: QueryParams): string {
  const params = new URLSearchParams()

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null || value === '') continue
      params.set(key, String(value))
    }
  }

  const search = params.toString()
  return `${API_URL}${path}${search ? `?${search}` : ''}`
}

async function readJson(response: Response): Promise<unknown> {
  const text = await response.text()
  if (!text) return undefined

  try {
    return JSON.parse(text) as unknown
  } catch {
    return undefined
  }
}

function fallbackMessage(status: number): string {
  if (status === 401) return 'Your session is not valid. Please sign in again.'
  if (status === 403) return 'You do not have permission to do that.'
  if (status === 429) return 'Too many attempts. Please wait a moment and try again.'
  if (status >= 500) return 'The server ran into a problem. Please try again shortly.'
  return `The request failed (${status}).`
}

function toApiError(status: number, payload: unknown): ApiError {
  // Backend error shape: { error: { code, message } }
  if (typeof payload === 'object' && payload !== null && 'error' in payload) {
    const detail = (payload as { error: unknown }).error

    if (typeof detail === 'object' && detail !== null) {
      const { code, message } = detail as { code?: unknown; message?: unknown }

      if (typeof code === 'string' && typeof message === 'string') {
        return new ApiError(status, code, message)
      }
    }
  }

  return new ApiError(status, 'HTTP_ERROR', fallbackMessage(status))
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError'
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions<T>,
): Promise<T> {
  const { method = 'GET', query, body, authenticated = true, signal, parse } = options

  const headers: Record<string, string> = { Accept: 'application/json' }
  const token = authenticated ? getToken() : null

  if (token) headers['Authorization'] = `Bearer ${token}`
  if (body !== undefined) headers['Content-Type'] = 'application/json'

  let response: Response

  try {
    response = await fetch(buildUrl(path, query), {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    })
  } catch (error) {
    if (isAbortError(error)) throw error

    throw new ApiError(
      0,
      'NETWORK_ERROR',
      'Unable to reach the server. Check your connection and try again.',
    )
  }

  const payload = await readJson(response)

  if (!response.ok) {
    const error = toApiError(response.status, payload)

    // A saved token that the server rejects (expired/invalid) ends the session.
    if (response.status === 401 && token) {
      clearToken()
      unauthorizedHandler?.()
    }

    throw error
  }

  return parse(payload)
}