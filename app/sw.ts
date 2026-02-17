/// <reference lib="webworker" />

import type { PrecacheEntry, SerwistGlobalConfig } from "serwist"
import { Serwist, CacheFirst, StaleWhileRevalidate, NetworkFirst } from "serwist"

// Extend ServiceWorkerGlobalScope
declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined
  }
}

declare const self: ServiceWorkerGlobalScope

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    {
      matcher: ({ request }) => request.destination === "image",
      handler: new CacheFirst({
        cacheName: "images",
        plugins: [
          {
            cacheWillUpdate: async ({ response }: { response: Response }) => {
              if (response && response.status === 200) {
                return response
              }
              return null
            },
          },
        ],
      }),
    },
    {
      matcher: ({ request }) =>
        request.destination === "script" || request.destination === "style",
      handler: new StaleWhileRevalidate({
        cacheName: "static-resources",
      }),
    },
    {
      matcher: ({ url }) => url.pathname.startsWith("/api/"),
      handler: new NetworkFirst({
        cacheName: "api-cache",
        plugins: [
          {
            cacheWillUpdate: async ({ response }: { response: Response }) => {
              if (response && response.status === 200) {
                return response
              }
              return null
            },
          },
        ],
        networkTimeoutSeconds: 10,
      }),
    },
    {
      matcher: ({ request }) => request.mode === "navigate",
      handler: new NetworkFirst({
        cacheName: "pages",
        plugins: [
          {
            handlerDidError: async () => {
              return caches.match("/offline")
            },
          },
        ],
      }),
    },
  ],
})

serwist.addEventListeners()

// Push notification handler
self.addEventListener("push", (event) => {
  if (event.data) {
    const data = event.data.json()
    const options = {
      body: data.body,
      icon: data.icon || "/icons/icon-192x192.png",
      badge: "/icons/icon-96x96.png",
      tag: data.tag || "promeals-notification",
      requireInteraction: data.requireInteraction || false,
      data: data.data || {},
      actions: data.actions || [],
    }

    event.waitUntil(self.registration.showNotification(data.title, options))
  }
})

// Notification click handler
self.addEventListener("notificationclick", (event) => {
  event.notification.close()

  const notificationData = event.notification.data
  let url = "/"

  if (notificationData && notificationData.url) {
    url = notificationData.url
  }

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        // Check if app is already open
        for (const client of clientList) {
          if (client.url === url && "focus" in client) {
            return client.focus()
          }
        }
        // Open new window if not already open
        if (self.clients.openWindow) {
          return self.clients.openWindow(url)
        }
      })
  )
})

// Background sync for offline data
self.addEventListener("sync", (event) => {
  const syncEvent = event as SyncEvent
  if (syncEvent.tag === "sync-meals") {
    syncEvent.waitUntil(syncMeals())
  } else if (syncEvent.tag === "sync-water") {
    syncEvent.waitUntil(syncWater())
  } else if (syncEvent.tag === "sync-weight") {
    syncEvent.waitUntil(syncWeight())
  }
})

// Sync functions
async function syncMeals() {
  try {
    const cache = await caches.open("promeals-sync")
    const requests = await cache.keys()

    for (const request of requests) {
      if (request.url.includes("/api/meals")) {
        try {
          const response = await fetch(request)
          if (response.ok) {
            await cache.delete(request)
          }
        } catch (error) {
          console.error("Failed to sync meal:", error)
        }
      }
    }
  } catch (error) {
    console.error("Sync meals error:", error)
  }
}

async function syncWater() {
  try {
    const cache = await caches.open("promeals-sync")
    const requests = await cache.keys()

    for (const request of requests) {
      if (request.url.includes("/api/water")) {
        try {
          const response = await fetch(request)
          if (response.ok) {
            await cache.delete(request)
          }
        } catch (error) {
          console.error("Failed to sync water entry:", error)
        }
      }
    }
  } catch (error) {
    console.error("Sync water error:", error)
  }
}

async function syncWeight() {
  try {
    const cache = await caches.open("promeals-sync")
    const requests = await cache.keys()

    for (const request of requests) {
      if (request.url.includes("/api/weight")) {
        try {
          const response = await fetch(request)
          if (response.ok) {
            await cache.delete(request)
          }
        } catch (error) {
          console.error("Failed to sync weight entry:", error)
        }
      }
    }
  } catch (error) {
    console.error("Sync weight error:", error)
  }
}

// Periodic background sync for meal reminders
self.addEventListener("periodicsync", (event) => {
  const periodicEvent = event as unknown as { tag: string; waitUntil: (promise: Promise<void>) => void }
  if (periodicEvent.tag === "meal-reminders") {
    periodicEvent.waitUntil(showMealReminders())
  }
})

async function showMealReminders() {
  const now = new Date()
  const hour = now.getHours()

  // Breakfast reminder (8 AM)
  if (hour === 8) {
    await self.registration.showNotification("Breakfast Time!", {
      body: "Don't forget to log your breakfast and stay on track with your nutrition goals.",
      icon: "/icons/icon-192x192.png",
      badge: "/icons/icon-96x96.png",
      tag: "breakfast-reminder",
      requireInteraction: false,
      data: { url: "/?action=log-meal&type=breakfast" },
    })
  }

  // Lunch reminder (12 PM)
  if (hour === 12) {
    await self.registration.showNotification("Lunch Time!", {
      body: "Time for lunch! Log your meal to keep your nutrition tracking up to date.",
      icon: "/icons/icon-192x192.png",
      badge: "/icons/icon-96x96.png",
      tag: "lunch-reminder",
      requireInteraction: false,
      data: { url: "/?action=log-meal&type=lunch" },
    })
  }

  // Dinner reminder (6 PM)
  if (hour === 18) {
    await self.registration.showNotification("Dinner Time!", {
      body: "Enjoy your dinner and remember to log it for accurate tracking.",
      icon: "/icons/icon-192x192.png",
      badge: "/icons/icon-96x96.png",
      tag: "dinner-reminder",
      requireInteraction: false,
      data: { url: "/?action=log-meal&type=dinner" },
    })
  }

  // Hydration reminder (every 3 hours)
  if (hour % 3 === 0 && hour >= 9 && hour <= 21) {
    await self.registration.showNotification("Stay Hydrated!", {
      body: "Remember to drink water! Log your intake to reach your daily goal.",
      icon: "/icons/icon-192x192.png",
      badge: "/icons/icon-96x96.png",
      tag: "hydration-reminder",
      requireInteraction: false,
      data: { url: "/?action=log-water" },
    })
  }
}

export {}
