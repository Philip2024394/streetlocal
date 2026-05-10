/* Products Local Chat — service worker for vendor push notifications */
const VENDOR_INBOX_URL = '/products/chat/?view=vendor-inbox'

self.addEventListener('install', (event) => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('push', (event) => {
  let data = {}
  try { data = event.data ? event.data.json() : {} } catch {
    try { data = { title: 'New order', body: event.data ? event.data.text() : '' } } catch {}
  }
  const title = data.title || 'New order'
  const body = data.body || ''
  const tag = data.conversationId ? `conv-${data.conversationId}` : 'productslocalchat-order'
  const options = {
    body,
    icon: '/products/chat/favicon.svg',
    badge: '/products/chat/favicon.svg',
    tag,
    renotify: true,
    requireInteraction: true,
    vibrate: [200, 100, 200],
    data: {
      conversationId: data.conversationId || null,
      vendorId: data.vendorId || null,
      url: data.url || VENDOR_INBOX_URL,
    },
  }
  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const target = (event.notification.data && event.notification.data.url) || VENDOR_INBOX_URL
  const convId = event.notification.data && event.notification.data.conversationId
  const url = convId ? `${target}&conv=${convId}` : target
  event.waitUntil((async () => {
    const allClients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
    for (const client of allClients) {
      try {
        if (client.url.includes('/products/chat/')) {
          await client.focus()
          client.postMessage({ type: 'OPEN_CONVERSATION', conversationId: convId })
          return
        }
      } catch {}
    }
    await self.clients.openWindow(url)
  })())
})
