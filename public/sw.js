self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('push', (event) => {
  const payload = event.data?.json?.() ?? {}
  const title = payload.title || 'Chamada recebida'
  const options = {
    body: payload.body || 'Você tem uma nova chamada.',
    tag: payload.tag || 'incoming_call',
    renotify: true,
    requireInteraction: true,
    vibrate: payload.vibrate || [300, 120, 300, 120, 500],
    data: {
      focusUrl: payload.focusUrl || '/area-consultor',
    },
  }
  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const focusUrl = event.notification.data?.focusUrl || '/area-consultor'
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(focusUrl) && 'focus' in client) {
          return client.focus()
        }
      }
      if (windowClients[0] && 'focus' in windowClients[0]) {
        return windowClients[0].focus()
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(focusUrl)
      }
      return undefined
    }),
  )
})
