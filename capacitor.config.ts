import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.whosnight.app',
  appName: "Who's Night",
  webDir: 'dist/public',
  server: {
    androidScheme: 'https'
  }
};

export default config;
