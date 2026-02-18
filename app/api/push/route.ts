import { NextResponse } from "next/server"
import webpush from "web-push"

// Configure VAPID only when environment variables are available
if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    "mailto:support@promeals.ai",
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  )
}

export async function POST(request: Request) {
  try {
    const { subscription, type, customMessage } = await request.json()

    if (!subscription) {
      return NextResponse.json(
        { error: "Subscription is required" },
        { status: 400 }
      )
    }

    let payload: {
      title: string
      body: string
      icon?: string
      tag?: string
      data?: Record<string, unknown>
      actions?: Array<{ action: string; title: string }>
    }

    switch (type) {
      case "welcome":
        payload = {
          title: "Welcome to ProMeals!",
          body: "You'll now receive meal reminders and nutrition tips.",
          icon: "/icons/icon-192x192.png",
          tag: "welcome",
        }
        break
      case "breakfast":
        payload = {
          title: "Breakfast Time!",
          body: "Start your day right! Log your breakfast to track your morning nutrition.",
          icon: "/icons/icon-192x192.png",
          tag: "breakfast-reminder",
          data: { url: "/?action=log-meal&type=breakfast" },
          actions: [
            { action: "log", title: "Log Meal" },
            { action: "dismiss", title: "Dismiss" },
          ],
        }
        break
      case "lunch":
        payload = {
          title: "Lunch Time!",
          body: "Don't forget to log your lunch. Keep your nutrition goals on track!",
          icon: "/icons/icon-192x192.png",
          tag: "lunch-reminder",
          data: { url: "/?action=log-meal&type=lunch" },
          actions: [
            { action: "log", title: "Log Meal" },
            { action: "dismiss", title: "Dismiss" },
          ],
        }
        break
      case "dinner":
        payload = {
          title: "Dinner Time!",
          body: "Enjoy your dinner and log it to complete your daily nutrition tracking.",
          icon: "/icons/icon-192x192.png",
          tag: "dinner-reminder",
          data: { url: "/?action=log-meal&type=dinner" },
          actions: [
            { action: "log", title: "Log Meal" },
            { action: "dismiss", title: "Dismiss" },
          ],
        }
        break
      case "hydration":
        payload = {
          title: "Stay Hydrated!",
          body: "Time to drink some water! Log your intake to reach your daily goal.",
          icon: "/icons/icon-192x192.png",
          tag: "hydration-reminder",
          data: { url: "/?action=log-water" },
          actions: [
            { action: "log", title: "Log Water" },
            { action: "dismiss", title: "Dismiss" },
          ],
        }
        break
      case "custom":
        payload = {
          title: customMessage?.title || "ProMeals Notification",
          body: customMessage?.body || "You have a new notification",
          icon: "/icons/icon-192x192.png",
          tag: "custom",
        }
        break
      default:
        payload = {
          title: "ProMeals",
          body: "Test notification from ProMeals AI",
          icon: "/icons/icon-192x192.png",
          tag: "test",
        }
    }

    // Check if VAPID keys are configured before sending notification
    if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
      return NextResponse.json(
        { error: "Push notifications are not configured" },
        { status: 500 }
      )
    }

    await webpush.sendNotification(
      subscription as webpush.PushSubscription,
      JSON.stringify(payload)
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error sending push notification:", error)
    return NextResponse.json(
      { error: "Failed to send notification" },
      { status: 500 }
    )
  }
}
