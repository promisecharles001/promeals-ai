"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Bell, BellOff, Check, AlertCircle } from "lucide-react"
import { usePushNotifications } from "@/hooks/usePushNotifications"

export function PushNotificationManager() {
  const {
    isSupported,
    subscription,
    permission,
    isLoading,
    error,
    toggleSubscription,
  } = usePushNotifications()

  const [showSettings, setShowSettings] = useState(false)

  if (!isSupported) {
    return (
      <div className="p-4 bg-muted rounded-lg">
        <div className="flex items-center gap-2 text-muted-foreground">
          <BellOff className="h-4 w-4" />
          <span className="text-sm">Push notifications are not supported in this browser</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Bell className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">Push Notifications</h3>
            <p className="text-sm text-muted-foreground">
              Get meal reminders and nutrition tips
            </p>
          </div>
        </div>
        <Switch
          checked={!!subscription}
          onCheckedChange={toggleSubscription}
          disabled={isLoading || permission === "denied"}
        />
      </div>

      {permission === "denied" && (
        <div className="flex items-start gap-2 p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <p>
            Notifications are blocked. Please enable them in your browser settings to receive meal reminders.
          </p>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {subscription && (
        <div className="p-3 bg-green-500/10 text-green-600 rounded-lg">
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4" />
            <span className="text-sm font-medium">Notifications enabled!</span>
          </div>
          <p className="text-xs text-green-600/80 mt-1">
            You'll receive meal reminders and hydration alerts.
          </p>
        </div>
      )}

      <div className="text-xs text-muted-foreground space-y-1">
        <p>You'll receive notifications for:</p>
        <ul className="list-disc list-inside space-y-0.5 ml-2">
          <li>Breakfast, lunch, and dinner reminders</li>
          <li>Hydration alerts every 3 hours</li>
          <li>Goal achievement celebrations</li>
        </ul>
      </div>
    </div>
  )
}
