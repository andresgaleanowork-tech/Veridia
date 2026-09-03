/**
 * Capacitor native bridge — detects the native environment and exposes
 * platform-specific helpers to the rest of the SPA.
 *
 * Usage:
 *   import { isNative, nativeInit } from '@/lib/native';
 *   if (isNative()) { ... }
 *
 * The `nativeInit()` function is called once from main.tsx on app boot.
 */

import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { Keyboard } from '@capacitor/keyboard';
import { Network } from '@capacitor/network';
import { PushNotifications } from '@capacitor/push-notifications';
import { LocalNotifications } from '@capacitor/local-notifications';

// ─── Re-exports ───────────────────────────────────────────────────
export { Capacitor };

/** True when running inside the native Android/iOS shell. */
export function isNative(): boolean {
  return Capacitor.isNativePlatform();
}

/** True when running on Android (native or Chrome). */
export function isAndroid(): boolean {
  return Capacitor.getPlatform() === 'android';
}

// ─── Status bar ───────────────────────────────────────────────────
async function configureStatusBar(): Promise<void> {
  if (!isNative()) return;
  try {
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setBackgroundColor({ color: '#0B1120' });
  } catch {
    // Not available on all devices
  }
}

// ─── Keyboard ─────────────────────────────────────────────────────
function setupKeyboardListeners(): void {
  if (!isNative()) return;

  Keyboard.addListener('keyboardWillShow', () => {
    document.body.classList.add('keyboard-open');
  });

  Keyboard.addListener('keyboardWillHide', () => {
    document.body.classList.remove('keyboard-open');
  });
}

// ─── Network monitoring ───────────────────────────────────────────
export type NetworkStatus = { connected: boolean; connectionType: string };

const networkListeners = new Set<(status: NetworkStatus) => void>();

export function onNetworkChange(cb: (status: NetworkStatus) => void): () => void {
  networkListeners.add(cb);
  return () => networkListeners.delete(cb);
}

function setupNetworkMonitoring(): void {
  Network.addListener('networkStatusChange', (status) => {
    const info: NetworkStatus = {
      connected: status.connected,
      connectionType: status.connectionType,
    };
    for (const cb of networkListeners) {
      try { cb(info); } catch { /* ignore */ }
    }
  });
}

export async function getNetworkStatus(): Promise<NetworkStatus> {
  const status = await Network.getStatus();
  return { connected: status.connected, connectionType: status.connectionType };
}

// ─── Push notifications ───────────────────────────────────────────
export type PushToken = { token: string };

const pushListeners = new Set<(token: string) => void>();
const notificationListeners = new Set<(data: Record<string, unknown>) => void>();

export function onPushToken(cb: (token: string) => void): () => void {
  pushListeners.add(cb);
  return () => pushListeners.delete(cb);
}

export function onPushNotification(cb: (data: Record<string, unknown>) => void): () => void {
  notificationListeners.add(cb);
  return () => notificationListeners.delete(cb);
}

async function registerPush(): Promise<void> {
  if (!isNative()) return;

  try {
    const permStatus = await PushNotifications.requestPermissions();
    if (permStatus.receive !== 'granted') {
      console.warn('[Push] Permission denied');
      return;
    }

    await PushNotifications.register();

    PushNotifications.addListener('registration', (token) => {
      for (const cb of pushListeners) {
        try { cb(token.value); } catch { /* ignore */ }
      }
    });

    PushNotifications.addListener('registrationError', (err) => {
      console.error('[Push] Registration error:', err);
    });

    PushNotifications.addListener('pushNotificationReceived', (notification) => {
      // Foreground notification — show in-app toast
      for (const cb of notificationListeners) {
        try { cb(notification.data as Record<string, unknown>); } catch { /* ignore */ }
      }
    });

    PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
      // User tapped the notification — navigate to relevant page
      const data = action.notification.data as Record<string, unknown>;
      if (data?.route) {
        window.location.hash = String(data.route);
      }
    });
  } catch (err) {
    console.warn('[Push] Setup failed:', err);
  }
}

// ─── Local notifications ──────────────────────────────────────────
export async function scheduleLocalNotification(
  title: string,
  body: string,
  scheduleAt: Date,
  data?: Record<string, unknown>,
): Promise<void> {
  if (!isNative()) return;

  const permStatus = await LocalNotifications.requestPermissions();
  if (permStatus.display !== 'granted') return;

  await LocalNotifications.schedule({
    notifications: [
      {
        title,
        body,
        id: Date.now(),
        schedule: { at: scheduleAt },
        extra: data,
        smallIcon: 'ic_launcher',
        largeIcon: 'ic_launcher',
      },
    ],
  });
}

// ─── App lifecycle ────────────────────────────────────────────────
export function onAppResume(cb: () => void): () => void {
  if (!isNative()) return () => {};
  const listener = CapApp.addListener('appStateChange', ({ isActive }) => {
    if (isActive) cb();
  });
  return () => { listener.then((l) => l.remove()); };
}

export function onAppUrlOpen(cb: (url: string) => void): () => void {
  if (!isNative()) return () => {};
  const listener = CapApp.addListener('appUrlOpen', (data) => {
    cb(data.url);
  });
  return () => { listener.then((l) => l.remove()); };
}

// ─── Init (called once from main.tsx) ─────────────────────────────
let initialized = false;

export async function nativeInit(): Promise<void> {
  if (initialized || !isNative()) return;
  initialized = true;

  console.log(`[Native] Initializing on ${Capacitor.getPlatform()}`);

  await configureStatusBar();
  setupKeyboardListeners();
  setupNetworkMonitoring();
  await registerPush();

  // Hide splash after everything is wired up
  await SplashScreen.hide();
}
