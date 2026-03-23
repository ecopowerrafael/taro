export const registerPwaServiceWorker = () => {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return
  }

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
