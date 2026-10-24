export class ApiError extends Error {
  readonly status: number
  readonly code: string

  constructor(status: number, code: string, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError
}

/** Returns a user-safe message; never leaks raw error internals. */
export function getErrorMessage(
  error: unknown,
  fallback = 'Something went wrong. Please try again.',
): string {
  return error instanceof ApiError ? error.message : fallback
}