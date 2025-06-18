# iOS Deployment Guide for Who's Night?

## Overview
Your co-parenting app is now prepared as a Progressive Web App (PWA) that can be installed on iOS devices like a native app.

## What's Been Added

### PWA Features
- **Web App Manifest**: Defines app metadata, icons, and display settings
- **Service Worker**: Enables offline functionality and caching
- **iOS-Specific Meta Tags**: Optimizes the app for iOS Safari
- **App Icons**: Custom icons for home screen installation

### Files Created
- `client/public/manifest.json` - PWA configuration
- `client/public/sw.js` - Service worker for offline support
- `client/public/icon.svg` - Scalable app icon
- `client/public/favicon.ico` - Browser favicon
- Icon files for various sizes (192px, 512px, 180px)

## Installation Instructions for Users

### On iPhone/iPad:
1. Open Safari and navigate to your deployed app URL
2. Tap the **Share** button (square with arrow pointing up)
3. Scroll down and tap **"Add to Home Screen"**
4. Edit the name if desired (defaults to "Who's Night?")
5. Tap **"Add"** in the top right

### App Features:
- Launches in full-screen mode (no Safari UI)
- Works offline for previously loaded content
- Appears as a native app icon on home screen
- Supports iOS status bar integration
- Optimized for portrait orientation

## Deployment Options

### Option 1: Replit Deployment (Recommended)
1. Click the "Deploy" button in Replit
2. Your app will be available at a `.replit.app` domain
3. Share this URL with users for installation

### Option 2: Custom Domain
1. Deploy to Replit first
2. Configure a custom domain in Replit settings
3. Update the `start_url` in `manifest.json` if needed

### Option 3: Other Hosting Platforms
The app can be deployed to any static hosting service:
- Vercel
- Netlify
- GitHub Pages
- Firebase Hosting

## App Store Alternative
While this PWA provides a native-like experience, if you want true App Store distribution, you would need to:
1. Use a framework like Capacitor or Cordova to wrap the web app
2. Build native iOS binaries
3. Submit to Apple App Store (requires Apple Developer account)

## Browser Compatibility
- **iOS Safari**: Full PWA support
- **Chrome on iOS**: Limited PWA features
- **Other iOS browsers**: Basic functionality

## Technical Details
- **Display Mode**: Standalone (full-screen)
- **Theme Color**: White (#ffffff)
- **Orientation**: Portrait
- **Offline Support**: Basic caching enabled
- **Touch Icons**: 180x180px for iOS

Your app is now ready for iOS deployment and installation!