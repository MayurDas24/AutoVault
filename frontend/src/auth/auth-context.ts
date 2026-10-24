import { createContext } from 'react'
import type { LoginInput, RegisterInput, User } from '../lib/api/types'

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated'

export interface AuthContextValue {
  status: AuthStatus
  user: User | null
  /** UI hint only. The API enforces every permission itself. */
  isAdmin: boolean
  /** Message to show on the sign-in page (e.g. an expired session). */
  notice: string | null
  login: (input: LoginInput) => Promise<void>
  /** Creates a customer account; it does not sign the user in. */
  register: (input: RegisterInput) => Promise<void>
  logout: () => void
  clearNotice: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)

const AUTH_PAGES = /^\/(login|register)(\/|\?|#|$)/

/** Accepts only in-app paths, so a crafted `from` can never redirect off-site. */
export function getSafeRedirectPath(value: unknown): string {
  if (
    typeof value === 'string' &&
    value.startsWith('/') &&
    !value.startsWith('//') &&
    !value.startsWith('/\\') &&
    !AUTH_PAGES.test(value)
  ) {
    return value
  }

  return '/'
}