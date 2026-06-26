import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.workforce.ai',
  appName: '10xWorkforce',
  webDir: 'out',
  // The mobile app is now configured as a live wrapper connected to your Render backend
  server: {
    url: 'https://capacitor-workforce-app.onrender.com',
    cleartext: true
  }
};

export default config;
