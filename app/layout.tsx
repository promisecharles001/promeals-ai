import type React from "react"
import type { Metadata, Viewport } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Suspense } from "react"
import "./globals.css"
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt"
import { OfflineIndicator } from "@/components/OfflineIndicator"

export const metadata: Metadata = {
  title: "ProMeals AI - Instant Nutrition Analysis",
  description:
    "AI-powered nutrition analysis and meal tracking. Upload photos, track macros, and achieve your health goals.",
  generator: "ProMeals AI",
  applicationName: "ProMeals AI",
  keywords: [
    "nutrition",
    "meal tracking",
    "calorie counter",
    "macro tracker",
    "AI food analysis",
    "diet app",
    "health",
    "fitness",
  ],
  authors: [{ name: "ProMeals AI" }],
  creator: "ProMeals AI",
  publisher: "ProMeals AI",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icons/apple-touch-icon.png", sizes: "180x180" },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "ProMeals AI",
    startupImage: [
      {
        url: "/splash/apple-splash-2048-2732.jpg",
        media:
          "(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)",
      },
      {
        url: "/splash/apple-splash-1668-2388.jpg",
        media:
          "(device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)",
      },
      {
        url: "/splash/apple-splash-1536-2048.jpg",
        media:
          "(device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)",
      },
      {
        url: "/splash/apple-splash-1170-2532.jpg",
        media:
          "(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)",
      },
      {
        url: "/splash/apple-splash-1284-2778.jpg",
        media:
          "(device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)",
      },
    ],
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://promeals.ai",
    siteName: "ProMeals AI",
    title: "ProMeals AI - Instant Nutrition Analysis",
    description:
      "AI-powered nutrition analysis and meal tracking. Upload photos, track macros, and achieve your health goals.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "ProMeals AI - Nutrition Analysis",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ProMeals AI - Instant Nutrition Analysis",
    description:
      "AI-powered nutrition analysis and meal tracking. Upload photos, track macros, and achieve your health goals.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "your-google-verification-code",
  },
  other: {
    "msapplication-TileColor": "#f97316",
    "msapplication-config": "/browserconfig.xml",
    "theme-color": "#0a0a0a",
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
  colorScheme: "dark light",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
        <meta name="apple-mobile-web-app-title" content="ProMeals AI" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="msapplication-TileColor" content="#f97316" />
        <meta name="msapplication-tap-highlight" content="no" />
        <link rel="mask-icon" href="/icons/safari-pinned-tab.svg" color="#f97316" />
        <link rel="shortcut icon" href="/favicon.ico" />
      </head>
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <OfflineIndicator />
        <Suspense fallback={null}>{children}</Suspense>
        <PWAInstallPrompt />
      </body>
    </html>
  )
}
