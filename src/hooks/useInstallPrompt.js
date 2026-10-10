import { useSyncExternalStore } from 'react'

// Chrome/Edge/Android fire `beforeinstallprompt` once the app meets the install criteria, often before
// React has mounted, so the event is captured at module load and kept here for whoever renders later.
let deferredPrompt = null
const listeners = new Set()
const notify = () => listeners.forEach((listener) => listener())

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault()
    deferredPrompt = event
    notify()
  })
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null
    notify()
  })
}

const subscribe = (listener) => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

// Returns `install` (shows the browser's install dialog) or null when the browser hasn't offered it:
// already installed, unsupported browser (Firefox desktop, Safari), or criteria not met.
export const useInstallPrompt = () => {
  const prompt = useSyncExternalStore(subscribe, () => deferredPrompt)
  if (!prompt) return null

  return async () => {
    prompt.prompt()
    await prompt.userChoice
    deferredPrompt = null
    notify()
  }
}
