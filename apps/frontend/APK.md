# Veridia — APK Android (Capacitor)

## Arquitectura

```
┌─────────────────────────────────────────────┐
│  Android APK (Capacitor WebView)            │
│  ┌───────────────────────────────────────┐  │
│  │  React SPA (dist/)                    │  │
│  │  ├── Login → JWT en localStorage     │  │
│  │  ├── Refresh token → cookie httpOnly  │  │
│  │  └── API calls → /api/*              │  │
│  └──────────────┬────────────────────────┘  │
│                 │ Capacitor Bridge           │
│  ┌──────────────▼────────────────────────┐  │
│  │  Plugins nativos:                     │  │
│  │  • Push Notifications (FCM)           │  │
│  │  • Status Bar                         │  │
│  │  • Keyboard                           │  │
│  │  • Network detection                  │  │
│  │  • Splash Screen                      │  │
│  │  • Local Notifications                │  │
│  └───────────────────────────────────────┘  │
└──────────────────────┬──────────────────────┘
                       │ HTTPS
                       ▼
              ┌─────────────────┐
              │  Vercel (SPA)   │
              │  /api/* proxy   │
              └────────┬────────┘
                       │
                       ▼
              ┌─────────────────┐
              │  Backend API    │
              │  (Express+PG)   │
              └─────────────────┘
```

## Prerrequisitos

- **Node.js** ≥ 20
- **pnpm** ≥ 9
- **Android Studio** (con Android SDK 34+)
- **JDK** 17 (viene con Android Studio)
- **Java** 17+

## Desarrollo rápido (Live Reload)

```bash
# 1. Build del frontend
cd apps/frontend
pnpm build

# 2. Sync con Android
pnpm cap:sync

# 3. Abrir en Android Studio
pnpm cap:open

# --- O directamente desde CLI ---
# Inicia el emulador y hace live reload:
pnpm cap:run:live
```

> **Live Reload**: Con `--livereload --external`, Vite sirve en tu IP local
> y el WebView del emulador carga desde ahí. Los cambios se reflejan al instante.

## Build de producción (APK firmado)

### 1. Generar keystore (solo la primera vez)

```bash
keytool -genkey -v \
  -keystore veridia-release.jks \
  -keyalg RSA -keysize 2048 \
  -validity 10000 \
  -alias veridia
```

Guarda el keystore y las contraseñas en un lugar seguro. **Nunca lo subas a Git.**

### 2. Configurar firma en `android/app/build.gradle`

```gradle
android {
    signingConfigs {
        release {
            storeFile file('veridia-release.jks')
            storePassword 'TU_PASSWORD'
            keyAlias 'veridia'
            keyPassword 'TU_KEY_PASSWORD'
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            shrinkResources true
        }
    }
}
```

### 3. Build

```bash
cd apps/frontend
pnpm build          # Build de la SPA
pnpm cap:sync       # Copiar assets al proyecto Android

# APK (más fácil de distribuir):
cd android
./gradlew assembleRelease

# AAB (para Google Play):
./gradlew bundleRelease
```

El APK estará en:
```
android/app/build/outputs/apk/release/app-release.apk
```

El AAB en:
```
android/app/build/outputs/bundle/release/app-release.aab
```

## Variables de entorno

El APK carga la SPA embebida (desde `dist/`). Las llamadas API van a `/api/*`
que se resuelven según la URL base configurada en `src/lib/api.ts` (`/api`).

**Importante**: En `capacitor.config.ts`, el `server.url` está comentado.
Si lo descomentas y apuntas a `https://veridia.tech`, el APK cargará la web
directamente desde Vercel en vez de la copia embebida. Útil para desarrollo.

## Push Notifications (FCM)

1. Crear proyecto en [Firebase Console](https://console.firebase.google.com/)
2. Registrar la app Android con package ID `tech.veridia.app`
3. Descargar `google-services.json` y colocarlo en `android/app/`
4. En el backend, configurar Firebase Admin SDK con las credenciales
5. El registro del token push ocurre automáticamente al iniciar la app

## Plugins instalados

| Plugin | Uso |
|--------|-----|
| `@capacitor/app` | Lifecycle (resume/pause), deep links |
| `@capacitor/status-bar` | Color y estilo de la barra de estado |
| `@capacitor/splash-screen` | Pantalla de carga con logo |
| `@capacitor/keyboard` | Ajuste de viewport al teclado virtual |
| `@capacitor/push-notifications` | Notificaciones push (FCM) |
| `@capacitor/local-notifications` | Notificaciones locales (citas, recordatorios) |
| `@capacitor/network` | Detección de conexión online/offline |
| `@capacitor/preferences` | Almacenamiento clave-valor nativo |
| `@capacitor/share` | Compartir contenido nativo |
| `@capacitor/filesystem` | Acceso al sistema de archivos |
| `@capacitor/haptics` | Feedback háptico |

## Estructura de archivos

```
apps/frontend/
├── capacitor.config.ts          # Config de Capacitor
├── android/                     # Proyecto Android nativo
│   ├── app/
│   │   ├── build.gradle         # Config de build
│   │   ├── proguard-rules.pro   # Reglas ProGuard
│   │   └── src/main/
│   │       ├── AndroidManifest.xml
│   │       ├── java/tech/veridia/app/
│   │       │   └── MainActivity.java
│   │       └── res/
│   └── build.gradle             # Config Gradle global
├── src/
│   ├── lib/
│   │   ├── native.ts            # Bridge Capacitor ←→ React
│   │   ├── api.ts               # Cliente API (axios)
│   │   └── pwa.ts               # Service Worker registration
│   └── main.tsx                 # Entry point (llama nativeInit)
└── public/
    ├── manifest.json            # PWA manifest
    └── icons/                   # App icons (reutilizados por Android)
```

## Troubleshooting

### "Could not find method compileSdkVersion"
Asegúrate de tener Android SDK 34+ instalado via Android Studio → SDK Manager.

### White screen en el APK
Verifica que `pnpm build` se ejecutó antes de `cap sync`. El `dist/` debe existir.

### Las cookies no funcionan en el APK
El WebView de Android usa `https://` como esquema (configurado en `capacitor.config.ts`).
Las cookies `SameSite=None; Secure` funcionan correctamente. Si usas `http://` en
desarrollo, las cookies `Secure` no se enviarán.

### Push notifications no llegan
1. Verifica que `google-services.json` está en `android/app/`
2. Verifica que el backend tiene Firebase Admin configurado
3. Revisa los logs: `adb logcat | grep -i push`
