'use client'

import { SafeArea } from 'app/provider/safe-area'
import { NavigationProvider } from './navigation'
import { AuthProvider } from './auth'

export function Provider({ children }: { children: React.ReactNode }) {
  return (
    <SafeArea>
      <AuthProvider>
        <NavigationProvider>{children}</NavigationProvider>
      </AuthProvider>
    </SafeArea>
  )
}
