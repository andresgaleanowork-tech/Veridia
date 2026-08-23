import { useAuthStore } from '@/stores/authStore';

interface ErrorContext {
  component: string;
  operation: string;
  userId?: string;
  timestamp: string;
  requestId?: string;
  additionalData?: Record<string, unknown>;
}

function getUserId(): string | undefined {
  try {
    return useAuthStore.getState().user?.id;
  } catch {
    return undefined;
  }
}

function getRequestId(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  return localStorage.getItem('veridia_request_id') || undefined;
}

function isDevelopment(): boolean {
  return import.meta.env.DEV;
}

export function captureError(error: unknown, context: Omit<ErrorContext, 'timestamp' | 'userId' | 'requestId'>): void {
  const fullContext: ErrorContext = {
    ...context,
    timestamp: new Date().toISOString(),
    userId: getUserId(),
    requestId: getRequestId(),
  };

  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : undefined;

  if (isDevelopment()) {
    console.group(`[Error] ${context.component} - ${context.operation}`);
    console.error('Message:', errorMessage);
    console.error('Stack:', errorStack);
    console.error('Context:', fullContext);
    console.groupEnd();
  } else {
    try {
      const payload = {
        message: errorMessage,
        stack: errorStack,
        context: fullContext,
        url: typeof window !== 'undefined' ? window.location.href : '',
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      };

      navigator.sendBeacon?.('/api/errors', JSON.stringify(payload));
    } catch {
      console.error('[Error Reporting] Failed to send error to service:', errorMessage);
    }
  }
}

function setupGlobalListeners(): void {
  if (typeof window === 'undefined') return;

  window.addEventListener('unhandledrejection', (event) => {
    captureError(event.reason, {
      component: 'global',
      operation: 'unhandledrejection',
    });
  });

  window.addEventListener('error', (event) => {
    captureError(event.error || new Error(event.message), {
      component: 'global',
      operation: 'unhandledError',
      additionalData: {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      },
    });
  });
}

if (typeof window !== 'undefined') {
  setupGlobalListeners();
}
