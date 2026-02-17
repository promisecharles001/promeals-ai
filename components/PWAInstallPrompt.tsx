"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Download, X } from "lucide-react"

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true)
      return
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setIsVisible(true)
    }

    const handleAppInstalled = () => {
      setIsInstalled(true)
      setIsVisible(false)
      setDeferredPrompt(null)
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
    window.addEventListener("appinstalled", handleAppInstalled)

    // Check localStorage to see if user dismissed the prompt
    const dismissed = localStorage.getItem("pwa-install-dismissed")
    const dismissedTime = dismissed ? parseInt(dismissed, 10) : 0
    const oneDay = 24 * 60 * 60 * 1000

    if (dismissedTime && Date.now() - dismissedTime < oneDay) {
      setIsVisible(false)
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
      window.removeEventListener("appinstalled", handleAppInstalled)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === "accepted") {
      console.log("User accepted the install prompt")
    } else {
      console.log("User dismissed the install prompt")
    }

    setDeferredPrompt(null)
    setIsVisible(false)
  }

  const handleDismiss = () => {
    setIsVisible(false)
    localStorage.setItem("pwa-install-dismissed", Date.now().toString())
  }

  if (!isVisible || isInstalled) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-background border border-border rounded-lg shadow-lg p-4 z-50 animate-in slide-in-from-bottom-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <h3 className="font-semibold text-sm">Install ProMeals AI</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Install our app for quick access and a better experience with offline support.
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 shrink-0"
          onClick={handleDismiss}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      <Button
        className="w-full mt-3 gap-2"
        onClick={handleInstallClick}
      >
        <Download className="h-4 w-4" />
        Install App
      </Button>
    </div>
  )
}
