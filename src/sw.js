// Network-only service worker: it exists so the app can be installed, and caches nothing, so every
// load gets the latest deploy. It also deletes any caches left by the old precaching worker.
self.addEventListener('install', () => self.skipWaiting())

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) => Promise.all(names.map((name) => caches.delete(name))))
      .then(() => self.clients.claim()),
  )
})

// Every request goes straight to the network. Browsers expect a fetch handler on an installable app.
self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request))
})
