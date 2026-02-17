"use client"

import { WifiOff } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
      <div className="text-center space-y-6 max-w-md">
        <div className="flex justify-center">
          <div className="p-6 bg-muted rounded-full">
            <WifiOff className="h-16 w-16 text-muted-foreground" />
          </div>
        </div>
        
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">You&apos;re Offline</h1>
          <p className="text-muted-foreground">
            It looks like you&apos;ve lost your internet connection. Don&apos;t worry, your data is safe and will sync when you&apos;re back online.
          </p>
        </div>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            While offline, you can still:
          </p>
          <ul className="text-sm text-left space-y-2 bg-muted p-4 rounded-lg">
            <li className="flex items-center gap-2">
              <span className="h-2 w-2 bg-green-500 rounded-full" />
              View your meal history
            </li>
            <li className="flex items-center gap-2">
              <span className="h-2 w-2 bg-green-500 rounded-full" />
              See your nutrition progress
            </li>
            <li className="flex items-center gap-2">
              <span className="h-2 w-2 bg-green-500 rounded-full" />
              Access saved meal templates
            </li>
          </ul>
        </div>

        <Button 
          className="w-full" 
          onClick={() => typeof window !== 'undefined' && window.location.reload()}
        >
          Try Again
        </Button>

        <p className="text-xs text-muted-foreground">
          ProMeals AI works offline and will automatically sync your data when you reconnect.
        </p>
      </div>
    </div>
  )
}
