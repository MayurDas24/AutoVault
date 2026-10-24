import { QueryClient } from '@tanstack/react-query'
import { isApiError } from './api/errors'

/** Retry transient failures once, but never retry a definitive 4xx answer. */
function retryUnlessClientError(failureCount: number, error: unknown): boolean {
  if (isApiError(error) && error.status >= 400 && error.status < 500) return false
  return failureCount < 1
}

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        retry: retryUnlessClientError,
        refetchOnWindowFocus: false,
      },
    },
  })
}