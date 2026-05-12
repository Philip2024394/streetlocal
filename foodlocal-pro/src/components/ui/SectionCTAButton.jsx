/**
 * SectionCTAButton — "List Your Vehicle", "Start Selling", "Register Restaurant", etc.
 * Shown on section landing pages. Handles the full account gate flow:
 * 1. Not signed in → triggers sign up
 * 2. Signed in, no profile → triggers profile completion
 * 3. Ready → opens the section dashboard
 *
 * Usage:
 * <SectionCTAButton section="rentals" label="List Your Vehicle" onReady={() => setDashboardOpen(true)} />
 */
import { useAuth } from '@/hooks/useAuth'
import { useGuestGate } from '@/contexts/GuestGateContext'

const SECTION_CONFIG = {
  rentals:     { icon: '🚗', label: 'List Your Vehicle',     sublabel: 'Earn money from your vehicle' },
  marketplace: { icon: '🛍️', label: 'Start Selling',         sublabel: 'Open your shop on Indoo' },
  restaurant:  { icon: '🍽️', label: 'Register Restaurant',   sublabel: 'Get orders from Indoo users' },
  dating:      { icon: '💕', label: 'Create Profile',         sublabel: 'Find your match' },
  driver:      { icon: '🏍️', label: 'Become a Driver',       sublabel: 'Earn with your bike or car' },
  massage:     { icon: '💆', label: 'Register as Therapist',  sublabel: 'Offer your services on Indoo' },
}

export default function SectionCTAButton({ section, label, sublabel, onReady, className, style }) {
  const { user } = useAuth()
  const { openSignUp } = useGuestGate()
  const demoMode = import.meta.env.VITE_DEMO_MODE === 'true'

  const config = SECTION_CONFIG[section] || {}
  const displayLabel = label || config.label || 'Get Started'
  const displaySub = sublabel || config.sublabel || ''

  function handleClick() {
    // In demo mode, skip auth gate and go straight to dashboard
    if (demoMode) {
      onReady?.()
      return
    }

    // Not signed in — open sign up
    if (!user) {
      openSignUp()
      return
    }

    // Signed in — go to dashboard
    onReady?.()
  }

  return (
    <button className={className} style={style} onClick={handleClick}>
      {displayLabel}
    </button>
  )
}

export { SECTION_CONFIG }
