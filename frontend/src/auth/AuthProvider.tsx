import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { setUnauthorizedHandler } from '../lib/api/client'
import {
  getCurrentUser,
  login as loginRequest,
  register as registerRequest,
} from '../lib/api/endpoints'
import { isApiError } from '../lib/api/errors'
import type { LoginInput, RegisterInput, User } from '../lib/api/types'
import { clearToken, getToken, saveToken } from '../lib/session'
import { AuthContext } from './auth-context'
import type { AuthContextValue, AuthStatus } from './auth-context'

const EXPIRED_NOTICE = 'Your session has expired. Please sign in again.'
const UNVERIFIED_NOTICE = "We couldn't verify your saved session. Please sign in again."

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [status, setStatus] = useState<AuthStatus>(() =>
    getToken() ? 'loading' : 'unauthenticated',
  )
  const [user, setUser] = useState<User | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  // The API client calls this when the server rejects a saved token (401).
  useEffect(() => {
    setUnauthorizedHandler(() => {
      setUser(null)
      setStatus('unauthenticated')
      setNotice(EXPIRED_NOTICE)
      queryClient.clear()
    })

    return () => setUnauthorizedHandler(null)
  }, [queryClient])

  // Restore a saved session by asking the server who the token belongs to.
  useEffect(() => {
    if (!getToken()) return

    const controller = new AbortController()

    getCurrentUser(controller.signal)
      .then((currentUser) => {
        setUser(currentUser)
        setStatus('authenticated')
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return
        // A 401 was already handled by the unauthorized handler.
        if (isApiError(error) && error.status === 401) return

        setUser(null)
        setStatus('unauthenticated')
        setNotice(UNVERIFIED_NOTICE)
      })

    return () => controller.abort()
  }, [])

  const login = useCallback(
    async (input: LoginInput) => {
      const result = await loginRequest(input)
      saveToken(result.token)
      queryClient.clear()
      setUser(result.user)
      setNotice(null)
      setStatus('authenticated')
    },
    [queryClient],
  )

  const register = useCallback(async (input: RegisterInput) => {
    await registerRequest(input)
  }, [])

  const logout = useCallback(() => {
    clearToken()
    queryClient.clear()
    setUser(null)
    setNotice(null)
    setStatus('unauthenticated')
  }, [queryClient])

  const clearNotice = useCallback(() => setNotice(null), [])

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user,
      isAdmin: user?.role === 'ADMIN',
      notice,
      login,
      register,
      logout,
      clearNotice,
    }),
    [status, user, notice, login, register, logout, clearNotice],
  )

  return <AuthContext value={value}>{children}</AuthContext>
}