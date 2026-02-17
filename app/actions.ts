"use server"

import webpush from "web-push"

// Configure VAPID details
webpush.setVapidDetails(
  "mailto:support@promeals.ai",
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

export async function subscribeUser(subscription: PushSubscriptionJSON) {
  try {
    // In a production environment, you would store the subscription in a database
    // For now, we'll store it in a simple in-memory store or localStorage on client
    console.log("User subscribed:", subscription)
    
    // Send a welcome notification
    await sendNotification(subscription, {
      title: "Welcome to ProMeals!",
      body: "You'll now receive meal reminders and nutrition tips.",
      icon: "/icons/icon-192x192.png",
      tag: "welcome",
    })

    return { success: true }
  } catch (error) {
    console.error("Error subscribing user:", error)
    return { success: false, error: "Failed to subscribe" }
  }
}

export async function unsubscribeUser(subscription: PushSubscriptionJSON) {
  try {
    // In production, remove from database
    console.log("User unsubscribed:", subscription)
    return { success: true }
  } catch (error) {
    console.error("Error unsubscribing user:", error)
    return { success: false, error: "Failed to unsubscribe" }
  }
}

export async function sendNotification(
  subscription: PushSubscriptionJSON,
  payload: {
    title: string
    body: string
    icon?: string
    tag?: string
    requireInteraction?: boolean
    data?: Record<string, unknown>
    actions?: Array<{ action: string; title: string; icon?: string }>
  }
) {
  try {
    await webpush.sendNotification(
      subscription as webpush.PushSubscription,
      JSON.stringify(payload)
    )
    return { success: true }
  } catch (error) {
    console.error("Error sending notification:", error)
    return { success: false, error: "Failed to send notification" }
  }
}

// Helper function to send meal reminders
export async function sendMealReminder(
  subscription: PushSubscriptionJSON,
  mealType: "breakfast" | "lunch" | "dinner" | "snack"
) {
  const mealMessages = {
    breakfast: {
      title: "Breakfast Time!",
      body: "Start your day right! Log your breakfast to track your morning nutrition.",
    },
    lunch: {
      title: "Lunch Time!",
      body: "Don't forget to log your lunch. Keep your nutrition goals on track!",
    },
    dinner: {
      title: "Dinner Time!",
      body: "Enjoy your dinner and log it to complete your daily nutrition tracking.",
    },
    snack: {
      title: "Snack Time!",
      body: "Have a healthy snack? Log it now!",
    },
  }

  const message = mealMessages[mealType]

  return sendNotification(subscription, {
    ...message,
    icon: "/icons/icon-192x192.png",
    tag: `${mealType}-reminder`,
    data: { url: `/?action=log-meal&type=${mealType}` },
    actions: [
      { action: "log", title: "Log Meal" },
      { action: "dismiss", title: "Dismiss" },
    ],
  })
}

// Helper function to send hydration reminders
export async function sendHydrationReminder(subscription: PushSubscriptionJSON) {
  return sendNotification(subscription, {
    title: "Stay Hydrated!",
    body: "Time to drink some water! Log your intake to reach your daily goal.",
    icon: "/icons/icon-192x192.png",
    tag: "hydration-reminder",
    data: { url: "/?action=log-water" },
    actions: [
      { action: "log", title: "Log Water" },
      { action: "dismiss", title: "Dismiss" },
    ],
  })
}

// Helper function to send goal achievement notifications
export async function sendGoalAchievement(
  subscription: PushSubscriptionJSON,
  goalType: "calories" | "protein" | "water" | "weight"
) {
  const goalMessages = {
    calories: {
      title: "Goal Reached!",
      body: "Congratulations! You've reached your daily calorie goal.",
    },
    protein: {
      title: "Protein Goal Achieved!",
      body: "Great job! You've hit your protein target for today.",
    },
    water: {
      title: "Hydration Goal Met!",
      body: "Well done! You've reached your daily water intake goal.",
    },
    weight: {
      title: "Milestone Reached!",
      body: "Amazing progress! You've reached your weight goal.",
    },
  }

  const message = goalMessages[goalType]

  return sendNotification(subscription, {
    ...message,
    icon: "/icons/icon-192x192.png",
    tag: `goal-${goalType}`,
    requireInteraction: true,
    data: { url: "/?action=view-progress" },
  })
}
