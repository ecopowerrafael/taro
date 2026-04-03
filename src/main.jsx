import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { registerPwaServiceWorker } from './services/pwaService'
import { installNativeFetchBridge, isNativeApp } from './utils/runtimeConfig'

installNativeFetchBridge()

if (!isNativeApp()) {
  registerPwaServiceWorker()
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HelmetProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </HelmetProvider>
  </StrictMode>,
)
