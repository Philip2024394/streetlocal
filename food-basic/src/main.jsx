import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import VendorLoginPage from './VendorLoginPage'

// Route: /food/chat/login (or ?login=true) shows VendorLoginPage.
// Anything else mounts the main App. Keeps App.jsx's hook order
// consistent — the previous in-App early-return was triggering
// React's rules-of-hooks check on subsequent renders.
function decideView () {
  if (typeof window === 'undefined') return <App />
  const p = (window.location.pathname || '').toLowerCase()
  const q = new URLSearchParams(window.location.search)
  const isLogin = p.endsWith('/login') || p.endsWith('/login/') || q.get('login') === 'true'
  return isLogin ? <VendorLoginPage /> : <App />
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {decideView()}
  </React.StrictMode>
)
