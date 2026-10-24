import { useState } from 'react'
import type { ReactNode } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import type { QueryClient } from '@tanstack/react-query'
import { AuthProvider } from '../auth/AuthProvider'
import { createQueryClient } from '../lib/queryClient'

export interface AppProvidersProps {
  children: ReactNode
  /** Lets tests supply their own client (e.g. with retries disabled). */
  queryClient?: QueryClient
}

export function AppProviders({ children, queryClient }: AppProvidersProps) {
  const [defaultClient] = useState(createQueryClient)

  return (
    <QueryClientProvider client={queryClient ?? defaultClient}>
      <AuthProvider>{children}</AuthProvider>
    </QueryClientProvider>
  )
}