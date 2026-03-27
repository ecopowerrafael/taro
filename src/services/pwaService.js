let deferredInstallPrompt = null

const requestImmediateActivation = (registration) => {
  if (registration?.waiting) {
    registration.waiting.postMessage({ type: 'SKIP_WAITING' })
  }
}

export const registerPwaServiceWorker = () => {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return
  }

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault()
    deferredInstallPrompt = event
  })

  window.addEventListener('appinstalled', () => {
    deferredInstallPrompt = null
  })

  const registerWorker = async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js')

      requestImmediateActivation(registration)
      void registration.update()

      registration.addEventListener('updatefound', () => {
        const installingWorker = registration.installing
        if (!installingWorker) {
          return
        }

        installingWorker.addEventListener('statechange', () => {
          if (installingWorker.state === 'installed') {
            requestImmediateActivation(registration)
          }
        })
      })

      let refreshing = false
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (refreshing) {
          return
        }
        refreshing = true
        window.location.reload()
      })
    } catch {
      return
    }
  }

  if (document.readyState === 'complete') {
    void registerWorker()
    return
  }

  window.addEventListener('load', () => {
    void registerWorker()
  })
}

export const canPromptPwaInstall = () => Boolean(deferredInstallPrompt)

export const promptPwaInstall = async () => {
  if (!deferredInstallPrompt) {
    return { ok: false, reason: 'unavailable' }
  }

  const promptEvent = deferredInstallPrompt
  await promptEvent.prompt()
  const choice = await promptEvent.userChoice
  deferredInstallPrompt = null

  return {
    ok: choice?.outcome === 'accepted',
    outcome: choice?.outcome ?? 'dismissed',
  }
}
