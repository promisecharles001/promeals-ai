# ProMeals AI - PWA Setup Guide

This guide will help you set up and test the Progressive Web App (PWA) features of ProMeals AI.

## ✅ What's Been Implemented

### Core PWA Features
- ✅ **Web App Manifest** - App metadata for installation
- ✅ **Service Worker** - Advanced caching with Serwist
- ✅ **Offline Support** - Works without internet connection
- ✅ **Install Prompt** - Custom install button for users
- ✅ **Responsive Icons** - All required icon sizes (72x72 to 512x512)
- ✅ **Theme Colors** - Matches your dark/orange theme
- ✅ **Splash Screens** - iOS splash screen support

### Push Notifications
- ✅ **VAPID Setup** - Secure push notification support
- ✅ **Meal Reminders** - Breakfast, lunch, dinner, and hydration alerts
- ✅ **Goal Achievements** - Celebrate when users hit their targets
- ✅ **Custom Notifications** - API for sending custom messages
- ✅ **Notification UI** - Toggle settings in the app

### Advanced Features
- ✅ **Background Sync** - Sync data when back online
- ✅ **Offline Page** - Friendly offline message
- ✅ **Offline Indicator** - Visual indicator when connection is lost
- ✅ **Caching Strategies** - Optimized caching for different asset types
- ✅ **Periodic Sync** - Automated meal reminders

## 🚀 Quick Start

### 1. Generate VAPID Keys

Push notifications require VAPID keys. Generate them by running:

```bash
npx web-push generate-vapid-keys
```

You'll get output like:
```
Public Key:
BKxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

Private Key:
MExxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 2. Configure Environment Variables

Add the keys to your `.env.local` file:

```env
# PWA Push Notifications
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_public_key_here
VAPID_PRIVATE_KEY=your_private_key_here
```

### 3. Start Development Server

For PWA testing, you need HTTPS. Run:

```bash
npm run dev
```

This uses Next.js experimental HTTPS support.

### 4. Test PWA Features

1. **Open Chrome DevTools** → **Application** tab
2. Check **Manifest** - Should show your app details
3. Check **Service Workers** - Should show "sw.js" is active
4. Check **Cache Storage** - Should show cached assets

## 📱 Installing the PWA

### On Desktop (Chrome/Edge)
1. Visit your app URL
2. Look for the install icon (➕) in the address bar
3. Click "Install ProMeals AI"
4. App will open in standalone window

### On iOS (Safari)
1. Visit your app URL in Safari
2. Tap **Share** button
3. Scroll down and tap **"Add to Home Screen"**
4. App icon appears on home screen

### On Android (Chrome)
1. Visit your app URL
2. Tap the menu (⋮) → **"Add to Home Screen"**
3. Or wait for the install prompt banner
4. Tap "Install"

## 🔔 Testing Push Notifications

### Enable Notifications
1. Open the app
2. Look for notification settings (you may need to add this UI)
3. Toggle notifications ON
4. Accept browser permission prompt

### Test Notifications

Use the test API endpoint:

```bash
curl -X POST http://localhost:3000/api/push \
  -H "Content-Type: application/json" \
  -d '{
    "subscription": { /* your subscription object */ },
    "type": "breakfast"
  }'
```

Available notification types:
- `welcome` - Welcome message
- `breakfast` - Breakfast reminder
- `lunch` - Lunch reminder
- `dinner` - Dinner reminder
- `hydration` - Water reminder
- `custom` - Custom message (requires `customMessage` object)

### Automatic Reminders

The service worker automatically sends reminders at:
- **8:00 AM** - Breakfast reminder
- **12:00 PM** - Lunch reminder
- **6:00 PM** - Dinner reminder
- **Every 3 hours (9 AM - 9 PM)** - Hydration reminders

## 🧪 Testing Checklist

### Basic PWA
- [ ] App installs without errors
- [ ] Icons appear correctly on home screen
- [ ] App opens in standalone mode (no browser chrome)
- [ ] Splash screen displays on launch
- [ ] Theme color matches app

### Offline Functionality
- [ ] Disconnect internet
- [ ] App shows offline indicator
- [ ] Previously loaded pages still work
- [ ] Offline page displays correctly
- [ ] Reconnect internet - app syncs automatically

### Push Notifications
- [ ] Subscribe to notifications
- [ ] Receive welcome notification
- [ ] Receive meal reminders at correct times
- [ ] Click notification opens correct page
- [ ] Unsubscribe works correctly

### Performance
- [ ] Lighthouse PWA audit passes
- [ ] Service Worker installs successfully
- [ ] Caching works (check in DevTools)
- [ ] App loads quickly on repeat visits

## 🛠️ Troubleshooting

### "Service Worker not registering"
- Make sure you're using HTTPS (or localhost for development)
- Check browser console for errors
- Verify `sw.js` is accessible at `/sw.js`

### "Push notifications not working"
- Verify VAPID keys are set correctly
- Check browser notification permissions
- Ensure service worker is active
- Test in different browsers (Chrome works best)

### "Icons not showing"
- Verify all icon files exist in `public/icons/`
- Check icon paths in `manifest.ts`
- Clear browser cache and reload

### "App not installable"
- Must be served over HTTPS (except localhost)
- Manifest must be valid JSON
- Must have required icon sizes (at least 192x192 and 512x512)
- Service Worker must be registered

## 📂 File Structure

```
app/
├── manifest.ts              # PWA manifest configuration
├── sw.ts                    # Service Worker with Serwist
├── actions.ts               # Push notification server actions
├── layout.tsx               # Updated with PWA meta tags
├── offline/
│   └── page.tsx             # Offline page
├── api/
│   └── push/
│       └── route.ts         # Push notification API
components/
├── PWAInstallPrompt.tsx     # Install button component
├── PushNotificationManager.tsx  # Notification settings UI
├── OfflineIndicator.tsx     # Offline status indicator
public/
├── icons/                   # All PWA icons
│   ├── icon-192x192.png
│   ├── icon-512x512.png
│   ├── apple-touch-icon.png
│   └── ...
├── splash/                  # iOS splash screens
└── browserconfig.xml        # Windows tile config
```

## 🎨 Customization

### Change Theme Colors
Edit `app/manifest.ts`:
```typescript
background_color: "#your-color",
theme_color: "#your-color",
```

### Change Reminder Times
Edit `app/sw.ts`:
```typescript
// Change the hour values
if (hour === 8) { // Breakfast at 8 AM
if (hour === 12) { // Lunch at 12 PM
if (hour === 18) { // Dinner at 6 PM
```

### Add Custom Notifications
Use the `sendNotification` server action in your components:
```typescript
import { sendNotification } from "@/app/actions"

await sendNotification(subscription, {
  title: "Custom Title",
  body: "Custom message",
  icon: "/icons/icon-192x192.png",
})
```

## 📊 Production Deployment

### Before Deploying
1. Generate production VAPID keys
2. Update environment variables
3. Test all PWA features in production build
4. Verify HTTPS is enabled
5. Check all icons are accessible

### Vercel Deployment
The PWA works automatically on Vercel:
- HTTPS is provided automatically
- Icons are served from `public/` folder
- Service Worker is built automatically

### Other Hosts
Ensure your server:
- Serves over HTTPS
- Has proper cache headers for service worker
- Supports the required MIME types

## 🔒 Security Notes

- Never commit VAPID private keys to version control
- Use environment variables for all sensitive data
- Service Worker has scope limited to your domain
- Push notifications require user permission

## 📚 Resources

- [Next.js PWA Guide](https://nextjs.org/docs/app/building-your-application/configuring/progressive-web-apps)
- [Serwist Documentation](https://serwist.pages.dev/)
- [Web Push API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
- [PWA Checklist](https://web.dev/pwa-checklist/)

## 🆘 Getting Help

If you encounter issues:
1. Check browser console for errors
2. Use Chrome DevTools → Application tab
3. Test in Chrome first (best PWA support)
4. Verify all environment variables are set
5. Clear browser cache and unregister service worker for fresh testing

---

**Your ProMeals AI PWA is ready! 🎉**

Users can now install it like a native app and receive meal reminders.
