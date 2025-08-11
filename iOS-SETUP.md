# iOS App Setup Guide

This guide covers the complete setup process for converting the Who's Night? web application into a native iOS app using Capacitor.

## Prerequisites

- **macOS** with Xcode installed
- **Xcode 14+** (latest version recommended)
- **iOS Simulator** or physical iOS device
- **Apple Developer Account** (for device testing and App Store submission)
- **AdMob Account** (for monetization)

## Quick Start

1. **Build the web application:**
   ```bash
   npm run build
   ```

2. **Sync with iOS project:**
   ```bash
   npx cap sync ios
   ```

3. **Open in Xcode:**
   ```bash
   npx cap open ios
   ```

## Detailed Setup

### 1. Capacitor Configuration

The project includes a pre-configured `capacitor.config.ts` file:

```typescript
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.whosnight.app',
  appName: "Who's Night",
  webDir: 'dist/public',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    AdMob: {
      appId: 'ca-app-pub-3940256099942544~3347511713', // Test App ID
      testingDevices: ['YOUR_TESTING_DEVICE_ID'],
      initializeForTesting: true
    }
  }
};
```

### 2. AdMob Integration

#### Setting Up AdMob Account

1. **Create AdMob Account:**
   - Go to [admob.google.com](https://admob.google.com)
   - Sign in with Google account
   - Accept terms and conditions

2. **Create iOS App:**
   - Click "Apps" in sidebar
   - Click "Add App"
   - Select "iOS"
   - Enter app name: "Who's Night"
   - Choose "No" for Google Play (this is iOS)

3. **Generate Ad Unit IDs:**
   - **Banner Ad Unit:** For bottom banner ads
   - **Interstitial Ad Unit:** For full-screen ads
   - **Rewarded Ad Unit:** For reward-based ads

#### Configuring Production Ad Units

Replace test ad units in the following files:

**capacitor.config.ts:**
```typescript
plugins: {
  AdMob: {
    appId: 'ca-app-pub-YOUR-ACTUAL-APP-ID~1234567890',
    testingDevices: [], // Remove for production
    initializeForTesting: false // Set to false for production
  }
}
```

**client/src/services/ad-service.ts:**
```typescript
private readonly adUnitIds = {
  banner: 'ca-app-pub-YOUR-ACTUAL-BANNER-ID/1234567890',
  interstitial: 'ca-app-pub-YOUR-ACTUAL-INTERSTITIAL-ID/1234567890',
  rewarded: 'ca-app-pub-YOUR-ACTUAL-REWARDED-ID/1234567890',
};
```

### 3. Xcode Configuration

#### App Information

1. **Bundle Identifier:** `com.whosnight.app`
2. **Display Name:** Who's Night
3. **Version:** 1.0.0
4. **Build Number:** 1

#### App Icons

Create app icons in the following sizes:
- **1024x1024** - App Store icon
- **180x180** - iPhone app icon (@3x)
- **120x120** - iPhone app icon (@2x)
- **167x167** - iPad Pro app icon
- **152x152** - iPad app icon (@2x)
- **76x76** - iPad app icon

Place icons in `ios/App/App/Assets.xcassets/AppIcon.appiconset/`

#### Launch Screen

Customize the launch screen in `ios/App/App/Base.lproj/LaunchScreen.storyboard`

#### Signing & Capabilities

1. **Team:** Select your Apple Developer team
2. **Bundle Identifier:** Ensure it matches your App Store Connect app
3. **Signing Certificate:** Automatic or manual signing
4. **Capabilities:** Add any required capabilities (Push Notifications, etc.)

### 4. Testing

#### iOS Simulator Testing

```bash
# Build and run in simulator
npx cap run ios
```

#### Physical Device Testing

1. **Connect iOS device** via USB
2. **Trust computer** on device
3. **Select device** in Xcode
4. **Build and run** (Cmd+R)

#### Ad Testing

- Test ads will show automatically in development
- Use test device IDs for consistent testing
- Verify all ad types work correctly:
  - Banner ads appear at bottom
  - Interstitial ads show between screens
  - Rewarded ads provide user benefits

### 5. App Store Preparation

#### App Store Connect Setup

1. **Create App Record:**
   - Go to [appstoreconnect.apple.com](https://appstoreconnect.apple.com)
   - Click "My Apps" → "+"
   - Enter app information

2. **App Information:**
   - **Name:** Who's Night
   - **Bundle ID:** com.whosnight.app
   - **SKU:** whosnight-ios
   - **Primary Language:** English

3. **App Categories:**
   - **Primary:** Productivity
   - **Secondary:** Lifestyle

#### App Metadata

**App Description:**
```
Who's Night is the ultimate family coordination app designed for co-parents, families with teens, and busy households. Streamline your family's schedule management and task coordination all in one intuitive mobile app.

PERFECT FOR:
• Co-parents managing custody schedules
• Families with teenagers learning responsibility
• Busy households needing better organization
• Extended families coordinating activities

KEY FEATURES:
• Calendar Management - Coordinate schedules between family members
• Task Lists - Shared to-do lists with approval workflows
• Role-Based Access - Customized experience for parents and teens
• User Onboarding - Guided setup for new family members
• Real-Time Updates - Stay synchronized across all devices
• Secure Authentication - Protected family data with user accounts

BUILT FOR FAMILIES:
Who's Night understands that every family is different. Whether you're co-parenting after divorce, managing a household with teenagers, or coordinating with extended family members, our app adapts to your family's unique needs.

PRIVACY & SECURITY:
Your family's data is protected with secure authentication and encrypted sessions. We never share your personal information with third parties.

Download Who's Night today and bring harmony to your family's coordination!
```

**Keywords:**
```
family,co-parenting,schedule,calendar,tasks,organization,productivity,parenting,teens,coordination,household,custody,shared,planning
```

**Screenshots Required:**
- 6.7" iPhone (iPhone 14 Pro Max)
- 6.5" iPhone (iPhone 11 Pro Max, iPhone XS Max)
- 5.5" iPhone (iPhone 8 Plus)
- 12.9" iPad Pro (3rd gen)
- 12.9" iPad Pro (2nd gen)

#### Privacy Policy

Create a privacy policy covering:
- Data collection practices
- User authentication
- AdMob advertising
- Data sharing policies
- User rights and controls

Host at: `https://whosnight.com/privacy-policy`

### 6. Build for Distribution

#### Archive Build

1. **Select "Any iOS Device"** in Xcode
2. **Product → Archive**
3. **Wait for build to complete**
4. **Organizer window opens**

#### Upload to App Store

1. **Click "Distribute App"**
2. **Select "App Store Connect"**
3. **Choose distribution options**
4. **Upload**

#### TestFlight Beta Testing

1. **Add internal testers** in App Store Connect
2. **Create external test groups** if needed
3. **Distribute beta builds** for testing
4. **Collect feedback** and iterate

### 7. Production Checklist

#### App Configuration
- [ ] **Bundle Identifier:** `com.whosnight.app` (or your chosen ID)
- [ ] **App Name:** Who's Night
- [ ] **Version:** 1.0.0
- [ ] **Build Number:** Incremental (1, 2, 3...)
- [ ] **Deployment Target:** iOS 13.0 or later

#### AdMob Configuration
- [ ] **Production Ad Units:** All test IDs replaced with production keys.
- [ ] **AdMob App:** Approved and active in AdMob dashboard.
- [ ] **Payment Setup:** Payment information configured in AdMob.
- [ ] **Ad Policies:** Ensure compliance with AdMob policies.

#### App Store Assets & Metadata
- [ ] **App Icons:** All required sizes created and placed in `Assets.xcassets`.
- [ ] **Screenshots:** All required device sizes captured and uploaded.
- [ ] **App Preview:** Optional video preview created and uploaded.
- [ ] **App Description:** Compelling and accurate description written.
- [ ] **Keywords:** Relevant search terms added.
- [ ] **Privacy Policy:** Created, hosted, and linked in App Store Connect.

#### Final Checks
- [ ] App tested on multiple physical iOS devices and simulators.
- [ ] All features working correctly as per the manual test plan in `README.md`.
- [ ] No crashes or major bugs.
- [ ] Signing certificates are valid and correctly configured in Xcode.
- [ ] App follows iOS Human Interface Guidelines.
- [ ] Appropriate content rating selected in App Store Connect.
- [ ] Export compliance information provided.

### 8. TestFlight Beta Testing

#### Internal Testing
1. **Add Team Members:**
   - Up to 100 internal testers.
   - Immediate access after upload, no review required.
2. **Test Coverage:**
   - All app features.
   - Different iOS versions and device types.
   - Ad functionality.

#### External Testing
1. **Create Test Groups:**
   - Up to 10,000 external testers.
   - Requires a beta app review from Apple (24-48 hours).
2. **Public Link:** Once approved, a public link can be shared for anyone to join the beta.

### 9. App Store Review Process

#### Submission
1. **Complete App Information** in App Store Connect.
2. **Add Build** from the successfully tested TestFlight version.
3. **Submit for Review**.
4. **Review Time:** Typically 24-48 hours, but can vary.

#### Common Rejection Reasons
1. **Crashes or Bugs:** Test thoroughly before submission.
2. **Incomplete Information:** Fill out all required metadata fields.
3. **Privacy Policy:** Must be publicly accessible and accurate.
4. **Ad Implementation:** Must follow AdMob and Apple guidelines.
5. **Metadata:** Screenshots must accurately represent the app's functionality.

### 10. Maintenance & Post-Launch

#### Post-Launch Monitoring
- **Analytics:** Monitor downloads, revenue, and crashes in App Store Connect Analytics.
- **Ad Performance:** Track ad revenue and eCPM rates in the AdMob Dashboard.
- **User Feedback:** Keep an eye on App Store reviews and ratings.
- **Crash Reports:** Monitor crash reports in Xcode Organizer or a third-party tool.

#### Regular Updates
- **Version Updates:** Increment version and build numbers for each new release.
- **Metadata Updates:** Optimize description and keywords based on performance.
- **Dependency Updates:** Keep Capacitor and other dependencies up to date.
- **Feature Updates:** Plan new features based on user feedback and analytics.

#### Capacitor Updates

```bash
# Update Capacitor
npm install @capacitor/core@latest @capacitor/ios@latest

# Update plugins
npm install @capacitor-community/admob@latest

# Sync changes
npx cap sync ios
```

## Troubleshooting

### Common Issues

1. **Build Errors:**
   - Clean build folder: Product → Clean Build Folder
   - Delete derived data
   - Restart Xcode

2. **Signing Issues:**
   - Check Apple Developer account status
   - Verify certificates are valid
   - Ensure bundle ID matches

3. **Ad Issues:**
   - Verify AdMob account is active
   - Check ad unit IDs are correct
   - Ensure test mode is disabled for production

4. **Capacitor Sync Issues:**
   - Delete `ios/App/App/public` folder
   - Run `npm run build` again
   - Run `npx cap sync ios` again

### Getting Help

- **Capacitor Documentation:** [capacitorjs.com/docs](https://capacitorjs.com/docs)
- **AdMob Help:** [support.google.com/admob](https://support.google.com/admob)
- **Apple Developer:** [developer.apple.com/support](https://developer.apple.com/support)
- **Xcode Help:** Built-in help system in Xcode

## Success Metrics

Track these metrics after launch:
- **Downloads** and user acquisition
- **Ad revenue** and eCPM rates
- **User engagement** and retention
- **App Store ratings** and reviews
- **Crash reports** and performance issues

The iOS app is now ready for development, testing, and App Store submission!