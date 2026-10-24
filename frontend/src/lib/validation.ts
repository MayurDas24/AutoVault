export type FieldErrors<K extends string> = Partial<Record<K, string>>

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MAX_PASSWORD_BYTES = 72

function byteLength(value: string): number {
  return new TextEncoder().encode(value).length
}

function checkEmail(value: string): string | undefined {
  const email = value.trim()

  if (!email) return 'Enter your email address.'
  if (email.length > 254 || !EMAIL_PATTERN.test(email)) {
    return 'Enter a valid email address.'
  }

  return undefined
}

function checkPasswordLimits(value: string): string | undefined {
  if (byteLength(value) > MAX_PASSWORD_BYTES) {
    return 'Password must not exceed 72 bytes.'
  }
  if (value.includes('\0')) {
    return 'Password must not contain NUL characters.'
  }
  return undefined
}

export interface LoginValues {
  email: string
  password: string
}

export function validateLogin(values: LoginValues): FieldErrors<keyof LoginValues> {
  const errors: FieldErrors<keyof LoginValues> = {}

  const email = checkEmail(values.email)
  if (email) errors.email = email

  if (!values.password) {
    errors.password = 'Enter your password.'
  } else {
    const limit = checkPasswordLimits(values.password)
    if (limit) errors.password = limit
  }

  return errors
}

export interface RegisterValues {
  name: string
  email: string
  password: string
  confirmPassword: string
}

// Mirrors the backend rules in auth.validation.ts; the API still re-validates.
export function validateRegister(
  values: RegisterValues,
): FieldErrors<keyof RegisterValues> {
  const errors: FieldErrors<keyof RegisterValues> = {}
  const name = values.name.trim()

  if (name.length < 2) {
    errors.name = 'Enter your full name (at least 2 characters).'
  } else if (name.length > 100) {
    errors.name = 'Name must be 100 characters or fewer.'
  }

  const email = checkEmail(values.email)
  if (email) errors.email = email

  if (!values.password) {
    errors.password = 'Create a password.'
  } else if (values.password.length < 12) {
    errors.password = 'Password must be at least 12 characters.'
  } else {
    const limit = checkPasswordLimits(values.password)
    if (limit) errors.password = limit
  }

  if (!values.confirmPassword) {
    errors.confirmPassword = 'Confirm your password.'
  } else if (values.confirmPassword !== values.password) {
    errors.confirmPassword = 'Passwords do not match.'
  }

  return errors
}