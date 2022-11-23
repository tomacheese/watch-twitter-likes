/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck

// see https://laboradian.com/create-offline-site-using-sw/

const CACHE_VERSION = '{{VERSION}}'
const CACHE_NAME = `${registration.scope}!${CACHE_VERSION}`

const urlsToCache = ['/', 'script.js', '/favicons/']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache)
    }),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return cacheNames.filter((cacheName) => {
          return (
            cacheName.startsWith(`${registration.scope}!`) &&
            cacheName !== CACHE_NAME
          )
        })
      })
      .then((cachesToDelete) => {
        return Promise.all(
          cachesToDelete.map((cacheName) => {
            return caches.delete(cacheName)
          }),
        )
      }),
  )
})

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        return response
      }

      let fetchRequest = event.request.clone()

      return fetch(fetchRequest).then((response) => {
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response
        }

        let responseToCache = response.clone()

        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache)
        })

        return response
      })
    }),
  )
})
