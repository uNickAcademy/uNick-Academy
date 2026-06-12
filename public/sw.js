// uNick Academy – prosty service worker (offline shell + obsługa push gdy skonfigurowany)
const CACHE = 'unick-v1'
const SHELL = ['/', '/dashboard', '/manifest.webmanifest']

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).catch(() => {}))
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  )
  self.clients.claim()
})

// network-first dla nawigacji, cache-first dla statyki
self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET') return
  if (req.mode === 'navigate') {
    event.respondWith(fetch(req).catch(() => caches.match(req).then((r) => r || caches.match('/dashboard'))))
    return
  }
  event.respondWith(caches.match(req).then((r) => r || fetch(req)))
})

// Push (aktywne po skonfigurowaniu kluczy VAPID i wysyłce z serwera)
self.addEventListener('push', (event) => {
  let data = {}
  try { data = event.data ? event.data.json() : {} } catch (e) {}
  const title = data.title || 'uNick Academy'
  event.waitUntil(self.registration.showNotification(title, {
    body: data.body || '', icon: '/unicorn.PNG', badge: '/unicorn.PNG', data: data.url || '/dashboard',
  }))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(self.clients.openWindow(event.notification.data || '/dashboard'))
})
