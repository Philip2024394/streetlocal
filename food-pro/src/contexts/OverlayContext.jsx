import { createContext, useContext, useReducer, useCallback } from 'react'

/**
 * Overlay types rendered on top of the map.
 * Only one "primary" overlay is open at a time.
 */
export const OVERLAY = {
  NONE: null,
  DISCOVERY: 'discovery',     // tapped a live user
  GO_LIVE: 'go_live',         // local user opening go-live sheet
  PAYMENT_GATE: 'payment',    // ready to pay $2.99
  VENUE_REVEAL: 'venue',      // paid, showing exact location
  REPORT: 'report',           // reporting a user
}

const initialState = {
  type: OVERLAY.NONE,
  data: null,
}

function overlayReducer(state, action) {
  switch (action.type) {
    case 'OPEN':
      return { type: action.overlayType, data: action.data ?? null }
    case 'CLOSE':
      return initialState
    default:
      return state
  }
}

const OverlayContext = createContext(null)

export function OverlayProvider({ children }) {
  const [state, dispatch] = useReducer(overlayReducer, initialState)

  const openOverlay = useCallback((overlayType, data) => {
    dispatch({ type: 'OPEN', overlayType, data })
  }, [])

  const closeOverlay = useCallback(() => {
    dispatch({ type: 'CLOSE' })
  }, [])

  const openDiscovery = useCallback((session) => {
    openOverlay(OVERLAY.DISCOVERY, session)
  }, [openOverlay])

  const openGoLive = useCallback(() => {
    openOverlay(OVERLAY.GO_LIVE)
  }, [openOverlay])

  const openPayment = useCallback((otwRequest) => {
    openOverlay(OVERLAY.PAYMENT_GATE, otwRequest)
  }, [openOverlay])

  const openVenueReveal = useCallback((unlockData) => {
    openOverlay(OVERLAY.VENUE_REVEAL, unlockData)
  }, [openOverlay])

  const openReport = useCallback((session) => {
    openOverlay(OVERLAY.REPORT, session)
  }, [openOverlay])

  return (
    <OverlayContext.Provider value={{
      overlay: state,
      closeOverlay,
      openDiscovery,
      openGoLive,
      openPayment,
      openVenueReveal,
      openReport,
    }}>
      {children}
    </OverlayContext.Provider>
  )
}

export function useOverlay() {
  return useContext(OverlayContext)
}
