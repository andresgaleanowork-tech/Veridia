import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { registerServiceWorker } from './lib/pwa'
import { nativeInit, isNative } from './lib/native'
import { loadDictionary } from './i18n'
import { readStoredLocale } from './hooks/useLocale'

// Register the PWA service worker (no-op on non-HTTPS/non-localhost).
registerServiceWorker()

// Initialize Capacitor native plugins when running inside the APK shell.
if (isNative()) void nativeInit()

// El castellano viaja en el bundle; inglés y portugués van en chunks aparte.
// Si el usuario tiene otro idioma guardado, se pide ya para que llegue cuanto
// antes. El render no espera a la promesa: un fallo de red no bloquea la app.
const initialLocale = readStoredLocale()
if (initialLocale !== 'es') void loadDictionary(initialLocale)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
