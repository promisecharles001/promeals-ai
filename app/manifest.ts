import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ProMeals AI",
    short_name: "ProMeals",
    description:
      "AI-powered nutrition analysis and meal tracking. Upload photos, track macros, and achieve your health goals.",
    start_url: "/",
    display: "standalone",
    background_color: "#0a0a0a",
    theme_color: "#f97316",
    orientation: "portrait-primary",
    scope: "/",
    id: "/",
    lang: "en",
    dir: "ltr",
    categories: ["health", "fitness", "food", "lifestyle"],
    icons: [
      {
        src: "/icons/icon-72x72.png",
        sizes: "72x72",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-96x96.png",
        sizes: "96x96",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-128x128.png",
        sizes: "128x128",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-144x144.png",
        sizes: "144x144",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-152x152.png",
        sizes: "152x152",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-384x384.png",
        sizes: "384x384",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-192x192-maskable.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-512x512-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    screenshots: [
      {
        src: "/screenshots/mobile-1.png",
        sizes: "390x844",
        type: "image/png",
        form_factor: "narrow",
        label: "Track your meals with AI",
      },
      {
        src: "/screenshots/mobile-2.png",
        sizes: "390x844",
        type: "image/png",
        form_factor: "narrow",
        label: "Nutrition insights at a glance",
      },
      {
        src: "/screenshots/desktop-1.png",
        sizes: "1920x1080",
        type: "image/png",
        form_factor: "wide",
        label: "Desktop dashboard view",
      },
    ],
    shortcuts: [
      {
        name: "Log Meal",
        short_name: "Log",
        description: "Quickly log a new meal",
        url: "/?action=log-meal",
        icons: [{ src: "/icons/shortcut-log.png", sizes: "96x96" }],
      },
      {
        name: "View Progress",
        short_name: "Progress",
        description: "Check your nutrition progress",
        url: "/?action=view-progress",
        icons: [{ src: "/icons/shortcut-progress.png", sizes: "96x96" }],
      },
    ],
    related_applications: [],
    prefer_related_applications: false,
  }
}
