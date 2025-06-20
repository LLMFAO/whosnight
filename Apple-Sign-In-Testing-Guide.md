# Apple Sign In Testing Guide

## Overview
Your React Native Expo app now includes complete Apple Sign In authentication using `expo-apple-authentication`. This guide explains how to test the implementation.

## What's Been Implemented

### 1. App Configuration (`app.json`)
```json
{
  "expo": {
    "ios": {
      "usesAppleSignIn": true,
      "bundleIdentifier": "com.coparent.connect"
    },
    "plugins": [
      "expo-apple-authentication"
    ]
  }
}
```

### 2. Dependencies Added
- `expo-apple-authentication`: Native Apple Sign In functionality
- `expo-secure-store`: Secure credential storage

### 3. Apple Sign In Component (`src/components/AppleSignIn.js`)
Features implemented:
- Availability check for Apple Sign In
- Secure credential storage and retrieval
- Sign in and sign out functionality
- User state management
- Comprehensive error handling
- Privacy-focused UI design

### 4. Integration with Main App
- Added as new "🍎 Sign In" tab
- Shows authenticated user info in header
- Handles authentication state across app

## Testing Instructions

### Option 1: Expo Go App (Limited Testing)
**Note**: Apple Sign In requires a development build and won't work in Expo Go.

### Option 2: Development Build (Recommended)
1. Install Expo CLI and EAS CLI:
```bash
npm install -g @expo/cli eas-cli
```

2. Build development version:
```bash
cd react-native-app
eas build --profile development --platform ios
```

3. Install on iOS device via TestFlight or direct installation

### Option 3: iOS Simulator Testing
```bash
cd react-native-app
expo run:ios
```

## Expected Behavior

### First Time Sign In
1. Tap "🍎 Sign In" tab
2. See "Sign In to CoParent Connect" screen
3. Tap black "Sign In with Apple" button
4. Apple's native authentication modal appears
5. Choose to share or hide email/name
6. Complete with Face ID/Touch ID/passcode
7. Return to app with success message
8. User name appears in header
9. Button changes to "Sign Out with Apple"

### Authentication Data Received
The app logs detailed credential information:
- `user`: Unique Apple user identifier
- `email`: User's email (if shared)
- `fullName`: First and last name (if shared) 
- `identityToken`: JWT for backend verification
- `authorizationCode`: One-time code for server-side auth
- `realUserStatus`: Verification of real vs fake account

### Subsequent App Opens
- App checks for stored credentials
- Automatically shows signed-in state
- No re-authentication required

### Sign Out
1. Tap "Sign Out with Apple" button
2. Credentials cleared from secure storage
3. Returns to sign-in screen
4. User info removed from header

## Important Notes

### Development Requirements
- **iOS Device**: Apple Sign In only works on real iOS devices, not simulators for full testing
- **Apple Developer Account**: Required for production builds
- **Bundle Identifier**: Must match Apple Developer console settings

### Backend Integration (Next Steps)
The app provides these tokens for your backend:
- `identityToken`: Verify with Apple's servers
- `authorizationCode`: Exchange for refresh token
- `user`: Unique identifier for your user database

### Security Features
- Credentials stored in iOS Keychain via expo-secure-store
- Privacy protection - users can hide email/name
- Anti-fraud protection via realUserStatus
- Secure token handling

## Console Output Examples

### Successful Sign In:
```
Starting Apple Sign In process...
Apple Sign In Credential: {
  user: "001234.abcd1234...",
  email: "user@example.com",
  fullName: { givenName: "John", familyName: "Doe" },
  identityToken: "eyJhbGciOiJSUzI1NiIs...",
  authorizationCode: "c123abc...",
  realUserStatus: 1
}
User authenticated successfully: 001234.abcd1234...
```

### User Cancellation:
```
User cancelled Apple Sign In process
```

## Next Steps for Production

1. **Apple Developer Setup**:
   - Enable "Sign In with Apple" capability for your App ID
   - Generate Service ID and Key for backend verification

2. **Backend Implementation**:
   - Verify identityToken with Apple's servers
   - Create/update user accounts
   - Implement session management

3. **App Store Compliance**:
   - Required if you offer other third-party logins
   - Must be prominently displayed

## Troubleshooting

### "Sign In with Apple is not available"
- Check iOS version (13.0+ required)
- Verify device has Apple ID signed in
- Ensure proper app configuration

### Build Issues
- Verify bundle identifier matches Apple Developer setup
- Check EAS build configuration
- Ensure plugins array includes "expo-apple-authentication"

Your Apple Sign In implementation is now ready for testing and development!