/**
 * PWA registration + offline fallback wiring.
 *
 * - Registers the service worker when supported (production + localhost dev).
 * - Listens for the `veridia-offline` message from the SW to redirect to offline.html.
 * - Listens for `veridia-online` to refresh the active view.
 */

type MessageHandler = (data: Record<string, unknown>) => void;

const handlers = new Set<MessageHandler>();

function emit(data: Record<string, unknown>) {
  for (const h of handlers) {
    try { h(data); } catch { /* ignore */ }
  }
}

function isLocalhost(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname === '::1'
  );
}

function shouldRegister(): boolean {
  if (typeof window === 'undefined') return false;
  // Only register on HTTPS or localhost (SW requires secure context).
  if (window.location.protocol !== 'https:' && !isLocalhost()) return false;
  if (!('serviceWorker' in navigator)) return false;
  return true;
}

export function registerServiceWorker(): void {
  if (!shouldRegister()) return;

  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (refreshing) return;
    refreshing = true;
    window.location.reload();
  });

  navigator.serviceWorker.addEventListener('message', (event: MessageEvent) => {
    const data = (event.data || {}) as Record<string, unknown>;
    if (data.type === 'veridia-offline') {
      emit({ type: 'veridia-offline' });
    } else if (data.type === 'veridia-online') {
      emit({ type: 'veridia-online' });
    }
  });

  navigator.serviceWorker
    .register('/service-worker.js')
    .then((registration) => {
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (!newWorker) return;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New version available; prompt via event.
            emit({ type: 'veridia-update-available' });
          }
        });
      });
    })
    .catch(() => {
      // SW registration failed — app still works online.
    });
}

export default registerServiceWorker;
