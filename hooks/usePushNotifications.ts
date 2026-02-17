"use client"

import { useState, useEffect, useCallback } from "react"
import { subscribeUser, unsubscribeUser } from "@/app/actions"

export function usePushNotifications() {
  const [isSupported, setIsSupported] = useState(false)
  const [subscription, setSubscription] = useState<PushSubscription | null>(null)
  const [permission, setPermission] = useState<NotificationPermission>("default")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Check if push notifications are supported
    if (typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window) {
      setIsSupported(true)
      checkPermission()
      checkSubscription()
    }
  }, [])

  const checkPermission = () => {
    if ("Notification" in window) {
      setPermission(Notification.permission)
    }
  }

  const checkSubscription = async () => {
    try {
      const registration = await navigator.serviceWorker.ready
      const existingSubscription = await registration.pushManager.getSubscription()
      setSubscription(existingSubscription)
    } catch (err) {
      console.error("Error checking subscription:", err)
    }
  }

  const requestPermission = async () => {
    if (!isSupported) return false

    try {
      const result = await Notification.requestPermission()
      setPermission(result)
      return result === "granted"
    } catch (err) {
      console.error("Error requesting permission:", err)
      return false
    }
  }

  const urlBase64ToUint8Array = (base64String: string): ArrayBuffer => {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")
    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray.buffer
  }

  const subscribe = useCallback(async () => {
    if (!isSupported) {
      setError("Push notifications are not supported in this browser")
      return false
    }

    setIsLoading(true)
    setError(null)

    try {
      // First, request permission if not granted
      if (permission !== "granted") {
        const granted = await requestPermission()
        if (!granted) {
          setError("Notification permission denied")
          setIsLoading(false)
          return false
        }
      }

      // Get the service worker registration
      const registration = await navigator.serviceWorker.ready

      // Subscribe to push notifications
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      if (!vapidPublicKey) {
        setError("VAPID public key is not configured")
        setIsLoading(false)
        return false
      }

      const pushSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      })

      setSubscription(pushSubscription)

      // Send subscription to server
      const result = await subscribeUser(pushSubscription.toJSON())

      if (!result.success) {
        setError(result.error || "Failed to subscribe")
        setIsLoading(false)
        return false
      }

      setIsLoading(false)
      return true
    } catch (err) {
      console.error("Error subscribing:", err)
      setError("Failed to subscribe to push notifications")
      setIsLoading(false)
      return false
    }
  }, [isSupported, permission])

  const unsubscribe = useCallback(async () => {
    if (!subscription) return true

    setIsLoading(true)
    setError(null)

    try {
      // Unsubscribe from push manager
      const result = await subscription.unsubscribe()

      if (result) {
        setSubscription(null)
        // Notify server
        await unsubscribeUser(subscription.toJSON())
      }

      setIsLoading(false)
      return result
    } catch (err) {
      console.error("Error unsubscribing:", err)
      setError("Failed to unsubscribe")
      setIsLoading(false)
      return false
    }
  }, [subscription])

  const toggleSubscription = useCallback(async () => {
    if (subscription) {
      return await unsubscribe()
    } else {
      return await subscribe()
    }
  }, [subscription, subscribe, unsubscribe])

  return {
    isSupported,
    subscription,
    permission,
    isLoading,
    error,
    subscribe,
    unsubscribe,
    toggleSubscription,
    requestPermission,
  }
}
