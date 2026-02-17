"use client"

import { useState, useEffect } from "react"
import { Wifi, WifiOff } from "lucide-react"

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true)
  const [showIndicator, setShowIndicator] = useState(false)

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      // Keep the indicator visible for a moment to show the user they're back online
      setTimeout(() => setShowIndicator(false), 3000)
    }

    const handleOffline = () => {
      setIsOnline(false)
      setShowIndicator(true)
    }

    // Check initial state
    setIsOnline(navigator.onLine)
    if (!navigator.onLine) {
      setShowIndicator(true)
    }

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  if (!showIndicator) return null

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-50 px-4 py-2 text-center text-sm font-medium transition-colors duration-300 ${
        isOnline
          ? "bg-green-500 text-white"
          : "bg-destructive text-destructive-foreground"
      }`}
    >
      <div className="flex items-center justify-center gap-2">
        {isOnline ? (
          <>
            <Wifi className="h-4 w-4" />
            <span>Back online</span>
          </>
        ) : (
          <>
            <WifiOff className="h-4 w-4" />
            <span>You're offline. Some features may be limited.</span>
          </>
        )}
      </div>
    </div>
  )
}
