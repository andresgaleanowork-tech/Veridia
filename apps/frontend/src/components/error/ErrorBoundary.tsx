import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, RefreshCw, Home, Copy, Mail } from 'lucide-react';
import { captureError } from '@/lib/errorReporting';
import { ErrorBoundaryContext } from './ErrorBoundaryContext';
import { useTranslation } from '@/i18n/useTranslation';
import type { ErrorBoundaryProps, ErrorBoundaryFallbackProps } from './ErrorBoundaryContext';

export type { ErrorBoundaryFallbackProps };

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  requestId: string | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      requestId: null,
    };
  }

  static getDerivedStateFromError(_error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const requestId =
      typeof window !== 'undefined'
        ? localStorage.getItem('veridia_request_id') || crypto.randomUUID?.() || `req_${Date.now()}`
        : `req_${Date.now()}`;

    captureError(error, {
      component: 'ErrorBoundary',
      operation: 'componentDidCatch',
      additionalData: { errorInfo: errorInfo?.componentStack },
    });

    this.setState({
      error,
      requestId,
    });

    this.props.onError?.(error, errorInfo, requestId);
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    if (this.props.resetKeys && this.props.resetKeys.length > 0) {
      const hasResetKeyChanged = this.props.resetKeys.some(
        (key: unknown, index: number) => key !== prevProps.resetKeys?.[index]
      );
      if (hasResetKeyChanged) {
        this.resetError();
      }
    }
  }

  resetError() {
    this.setState({
      hasError: false,
      error: null,
      requestId: null,
    });
    this.props.onReset?.();
  }

  copyErrorDetails() {
    const { error, requestId } = this.state;
    if (!error) return;

    const errorDetails = [
      `Error: ${error.message}`,
      `Stack: ${error.stack}`,
      `Request ID: ${requestId}`,
      `URL: ${typeof window !== 'undefined' ? window.location.href : 'N/A'}`,
      `User Agent: ${typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A'}`,
      `Timestamp: ${new Date().toISOString()}`,
    ].join('\n');

    navigator.clipboard.writeText(errorDetails).then(() => {
      if (import.meta.env.DEV) console.log('Error details copied to clipboard'); // eslint-disable-line no-console -- feedback dev
    });
  }

  reportError() {
    const { error, requestId } = this.state;
    if (!error) return;

    const subject = `Veridia Error Report - ${requestId}`;
    const body = [
      'Please describe what you were doing when this error occurred:',
      '',
      '---',
      `Error: ${error.message}`,
      `Stack: ${error.stack}`,
      `Request ID: ${requestId}`,
      `URL: ${typeof window !== 'undefined' ? window.location.href : 'N/A'}`,
      `User Agent: ${typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A'}`,
      `Timestamp: ${new Date().toISOString()}`,
    ].join('\n');

    const mailtoLink = `mailto:support@veridia.tech?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoLink, '_blank');
  }

  render() {
    if (this.state.hasError) {
      const isDev = import.meta.env.DEV;
      const { navigate } = this.props;

      const fallbackProps: ErrorBoundaryFallbackProps = {
        error: this.state.error,
        requestId: this.state.requestId,
        resetError: this.resetError,
        isDev,
        navigate: navigate ?? (() => {}),
        copyErrorDetails: this.copyErrorDetails,
        reportError: this.reportError,
      };

      if (this.props.fallbackRender) {
        return (
          <ErrorBoundaryContext.Provider value={{
            error: this.state.error,
            requestId: this.state.requestId,
            resetError: this.resetError,
            hasError: this.state.hasError,
          }}>
            {this.props.fallbackRender(fallbackProps)}
          </ErrorBoundaryContext.Provider>
        );
      }

      return (
        <ErrorBoundaryContext.Provider value={{
          error: this.state.error,
          requestId: this.state.requestId,
          resetError: this.resetError,
          hasError: this.state.hasError,
        }}>
          <DefaultFallback {...fallbackProps} />
        </ErrorBoundaryContext.Provider>
      );
    }

    return (
      <ErrorBoundaryContext.Provider value={{
        error: null,
        requestId: null,
        resetError: this.resetError,
        hasError: false,
      }}>
        {this.props.children}
      </ErrorBoundaryContext.Provider>
    );
  }
}

function DefaultFallback({
  error,
  requestId,
  isDev,
  navigate,
  copyErrorDetails,
  reportError,
}: Omit<ErrorBoundaryFallbackProps, 'resetError'>) {
  const { t } = useTranslation();
  const [copied, setCopied] = React.useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="min-h-screen bg-[#0B1120] flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card max-w-2xl w-full p-8 border-red-500/20"
      >
        <div className="mx-auto w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-6">
          <AlertTriangle className="w-8 h-8 text-red-400" />
        </div>

        <h1 className="text-2xl font-bold text-text mb-2 text-center">
          {t('common.somethingWentWrong')}
        </h1>

        <p className="text-text-3 text-sm mb-6 text-center">
          La aplicación encontró un error inesperado. Por favor, intenta nuevamente o contacta a soporte.
        </p>

        <AnimatePresence mode="wait">
          {requestId && (
            <motion.div
              key="request-id"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="text-left bg-black/30 rounded-lg p-4 mb-6"
            >
              <div className="flex items-center justify-between mb-2">
                <p className="text-text-3 text-xs font-medium">Código de soporte</p>
                <button
                  onClick={copyErrorDetails}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-surface-2 border border-border rounded-lg text-text-3 hover:bg-surface-3 hover:text-text transition-colors"
                >
                  <Copy size={12} className={copied ? 'text-success' : 'text-text-3'} />
                  <span>{copied ? '¡Copiado!' : 'Copiar'}</span>
                </button>
              </div>
              <div className="flex items-center gap-2">
                <code className="flex-1 font-mono text-primary text-xs break-all bg-black/20 px-2 py-1 rounded">{requestId}</code>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(requestId || '');
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-surface-2 border border-border rounded-lg text-text-3 hover:bg-surface-3 hover:text-text transition-colors"
                >
                  <Copy size={12} className={copied ? 'text-success' : 'text-text-3'} />
                  <span>{copied ? '¡Copiado!' : 'Copiar ID'}</span>
                </button>
              </div>
              <p className="text-text-3 text-xs mt-2">
                Contacta a soporte técnico con este código para una resolución más rápida.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {isDev && error && (
          <AnimatePresence mode="wait">
            <motion.div
              key="dev-error"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="text-left bg-black/30 rounded-lg p-4 mb-6 max-h-64 overflow-auto"
            >
              <p className="text-red-400 font-mono text-xs mb-2">{error.message}</p>
              <pre className="text-text-3 font-mono text-xs whitespace-pre-wrap break-all">{error.stack}</pre>
            </motion.div>
          </AnimatePresence>
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key="actions"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col sm:flex-row gap-3 justify-center"
          >
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => window.location.reload()}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 transition-colors font-medium"
            >
              <RefreshCw className="w-4 h-4" />
              {t('common.retry')}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={reportError}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 transition-colors font-medium"
            >
              <Mail className="w-4 h-4" />
              Reportar Error
            </motion.button>

            {navigate && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/')}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-white/5 border border-white/10 text-text hover:bg-white/10 transition-colors font-medium"
              >
              <Home className="w-4 h-4" />
              {t('common.goToDashboard')}
              </motion.button>
            )}
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}

function DefaultSuspenseFallback() {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-[#0B1120] flex items-center justify-center p-4">
      <div className="glass-card p-8 text-center">
        <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-text-3 text-sm">{t('common.loading')}</p>
      </div>
    </div>
  );
}

export function AsyncErrorBoundary({
  children,
  fallback,
  ...props
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
} & Omit<ErrorBoundaryProps, 'children'>) {
  return (
    <React.Suspense fallback={fallback || <DefaultSuspenseFallback />}>
      <ErrorBoundary {...props}>{children}</ErrorBoundary>
    </React.Suspense>
  );
}