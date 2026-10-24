const TOKEN_KEY = 'autovault.token'

// Only the JWT is persisted. The user and role are always re-fetched from
// the server (GET /api/auth/me) so a stale or edited role is never trusted.

export function getToken(): string | null {
  try {
    return window.localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function saveToken(token: string): void {
  try {
    window.localStorage.setItem(TOKEN_KEY, token)
  } catch {
    // Storage unavailable (private mode, quota): the session lasts until reload.
  }
}

export function clearToken(): void {
  try {
    window.localStorage.removeItem(TOKEN_KEY)
  } catch {
    // Nothing to clear.
  }
}