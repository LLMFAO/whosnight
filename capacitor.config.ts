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
      appId: 'ca-app-pub-3940256099942544~3347511713',
      testingDevices: ['YOUR_TESTING_DEVICE_ID'],
      initializeForTesting: true
    }
  }
};

export default config;