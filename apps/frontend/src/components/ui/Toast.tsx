/* eslint-disable react/only-export-components */
import { createContext, useContext, useState, useCallback, useRef, useEffect, type ReactNode } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';

// eslint-disable-next-line react-refresh/only-export-components
export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: number;
  variant: ToastVariant;
  title: string;
  description?: string;
  duration?: number;
}

export interface ToastContextValue {
  addToast: (variant: ToastVariant, title: string, description?: string, duration?: number) => void;
  dismissToast: (id: number) => void;
  dismissAll: () => void;
  toasts: ToastItem[];
}

export const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const variantConfig: Record<ToastVariant, { icon: ReactNode; className: string }> = {
  success: {
    icon: <CheckCircle2 size={18} />,
    className: 'border-success/30 bg-success/10',
  },
  error: {
    icon: <XCircle size={18} />,
    className: 'border-danger/30 bg-danger/10',
  },
  warning: {
    icon: <AlertTriangle size={18} />,
    className: 'border-warning/30 bg-warning/10',
  },
  info: {
    icon: <Info size={18} />,
    className: 'border-info/30 bg-info/10',
  },
};

function ToastItemComponent({ toast, onDismiss, onMouseEnter, onMouseLeave }: { 
  toast: ToastItem; 
  onDismiss: (id: number) => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}) {
  const config = variantConfig[toast.variant];
  const [progress, setProgress] = useState(100);
  const duration = toast.duration ?? 4000;
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isPausedRef = useRef(false);

  useEffect(() => {
    let startTime = Date.now();
    let elapsed = 0;

    const tick = () => {
      if (isPausedRef.current) return;
      elapsed = Date.now() - startTime;
      const newProgress = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(newProgress);
      if (newProgress <= 0) {
        onDismiss(toast.id);
      }
    };

    intervalRef.current = setInterval(tick, 50);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [duration, toast.id, onDismiss]);

  const handleMouseEnter = () => {
    isPausedRef.current = true;
    onMouseEnter();
  };

  const handleMouseLeave = () => {
    isPausedRef.current = false;
    onMouseLeave();
  };

  return (
    <div
      key={toast.id}
      role="alert"
      className={`glass flex items-start gap-3 rounded-2xl border px-4 py-3 shadow-lg ${config.className} animate-slide-in`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <span className="mt-0.5 shrink-0">{config.icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-text">{toast.title}</p>
        {toast.description && (
          <p className="mt-0.5 text-xs text-text-2">{toast.description}</p>
        )}
        <div className="mt-2 h-1 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-current transition-all duration-50 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        aria-label="Cerrar notificación"
        className="shrink-0 rounded-lg p-1 text-text-3 hover:text-text hover:bg-white/10 transition-colors"
      >
        <X size={14} />
      </button>
    </div>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const counterRef = useRef(0);

  const addToast = useCallback((
    variant: ToastVariant,
    title: string,
    description?: string,
    duration?: number
  ) => {
    const id = ++counterRef.current;
    setToasts((prev) => [...prev, { id, variant, title, description: description ?? '', duration }]);
  }, []);

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const dismissAll = useCallback(() => {
    setToasts([]);
  }, []);

  return (
    <ToastContext.Provider value={{ addToast, dismissToast, dismissAll, toasts }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[999] flex w-[380px] max-w-[calc(100vw-2rem)] flex-col gap-3">
        {toasts.map((toast) => (
          <ToastItemComponent
            key={toast.id}
            toast={toast}
            onDismiss={dismissToast}
            onMouseEnter={() => {}}
            onMouseLeave={() => {}}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return ctx;
}