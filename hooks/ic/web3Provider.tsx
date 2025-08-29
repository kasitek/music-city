'use client'
import { AuthProvider } from './auth-context'


export function Web3Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>

  )
}