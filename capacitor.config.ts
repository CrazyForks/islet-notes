import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.hamsterbase.islet',
  appName: 'Islet',
  webDir: 'dist',
  backgroundColor: '#ededed',
  android: {
    backgroundColor: '#ededed',
  },
  plugins: {
    SystemBars: {
      insetsHandling: 'disable',
      style: 'LIGHT',
      hidden: false,
      animation: 'NONE',
    },
  },
};

export default config;
