let deferredInstallPrompt = null

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
      await navigator.serviceWorker.register('/sw.js')
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
