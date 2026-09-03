import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'tech.veridia.app',
  appName: 'Veridia',
  webDir: 'dist',
  // URL del backend API — se usa en producción para que el WebView cargue la
  // SPA directamente desde el servidor.  En desarrollo se puede apuntar a
  // localhost con `cap run android --livereload`.
  server: {
    // En producción el APK carga la SPA embebida (webDir).
    // Para desarrollo rápido sin rebuild:
    //   url: 'https://veridia.tech',
    //   cleartext: true,
    androidScheme: 'https',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      launchAutoHide: true,
      backgroundColor: '#0B1120',
      androidSplashResourceName: 'splash',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#0B1120',
    },
    Keyboard: {
      resize: 'body',
      style: 'DARK',
      resizeOnFullScreen: true,
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
  android: {
    // Permisos que se añaden al AndroidManifest automáticamente
    allowMixedContent: false,
    backgroundColor: '#0B1120',
    buildOptions: {
      keystorePath: undefined,   // Se configura al firmar para release
      keystoreAlias: undefined,
    },
  },
};

export default config;
