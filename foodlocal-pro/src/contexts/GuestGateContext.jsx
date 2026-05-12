import { createContext, useContext, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import JoinSheet from '@/screens/onboarding/JoinSheet'

const GuestGateContext = createContext({ triggerGate: () => {}, openSignUp: () => {} })

export function GuestGateProvider({ children }) {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)

  const demoMode = import.meta.env.VITE_DEMO_MODE === 'true'

  // Triggered automatically when guest taps a gated feature
  const triggerGate = () => {
    if (!user && !demoMode) setOpen(true)
  }

  // Explicitly opens the sign-up / join sheet regardless of demo mode
  // Used by auth walls that intentionally prompt the user to create an account
  const openSignUp = () => setOpen(true)

  return (
    <GuestGateContext.Provider value={{ triggerGate, openSignUp }}>
      {children}
      <JoinSheet open={open} onClose={() => setOpen(false)} />
    </GuestGateContext.Provider>
  )
}

export const useGuestGate = () => useContext(GuestGateContext)
