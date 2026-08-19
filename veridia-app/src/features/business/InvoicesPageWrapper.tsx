import React from 'react';
import { ErrorBoundary } from '@/components/error/ErrorBoundary';
import { InvoicesPage } from './InvoicesPage';
import { FileText, RefreshCw, Home, Mail } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface FallbackProps {
  error: Error | null;
  requestId: string | null;
  resetError: () => void;
  isDev: boolean;
  navigate?: (path: string) => void;
  copyErrorDetails: () => void;
  reportError: () => void;
}

function InvoicesPageFallback({ error, requestId, resetError, isDev, navigate, copyErrorDetails, reportError }: FallbackProps) {
  const [copied, setCopied] = React.useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="min-h-screen bg-[#0B1120] flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card max-w-lg w-full p-8 border-red-500/20"
      >
        <div className="mx-auto w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-6">
          <FileText className="w-8 h-8 text-red-400" />
        </div>

        <h1 className="text-2xl font-bold text-text mb-2 text-center">
          Error en Facturas
        </h1>

        <p className="text-text-3 text-sm mb-6 text-center">
          No se pudo cargar las facturas. Intenta recargar o contacta a soporte.
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
              <p className="text-xs text-text-3 mb-2">Request ID:</p>
              <div className="flex gap-2">
                <code className="flex-1 text-xs bg-black/50 px-2 py-1 rounded text-text-2 break-all">{requestId}</code>
                <button
                  onClick={() => { copyErrorDetails(); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                  className="px-3 py-1.5 text-xs bg-white/10 rounded hover:bg-white/20 transition-colors"
                >
                  {copied ? 'Copiado!' : 'Copiar'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex gap-3">
          {navigate && (
            <button
              onClick={() => navigate('/business/invoices')}
              className="flex-1 py-2.5 bg-gradient-to-r from-[#0891B2] to-[#0E7490] rounded-lg text-sm font-bold text-white hover:shadow-lg transition-all"
            >
              <RefreshCw className="w-4 h-4 inline mr-2" /> Recargar
            </button>
          )}
          <button
            onClick={resetError}
            className="flex-1 py-2.5 border border-white/10 rounded-lg text-sm font-medium text-white/60 hover:text-white hover:bg-white/5 transition-colors"
          >
            <Home className="w-4 h-4 inline mr-2" /> Inicio
          </button>
        </div>

        {isDev && error && (
          <details className="mt-6 text-left">
            <summary className="text-xs text-text-3 cursor-pointer mb-2">Detalles técnicos</summary>
            <pre className="text-[10px] bg-black/50 p-3 rounded overflow-auto text-red-300 max-h-48">
              {error.message}\n{error.stack}
            </pre>
          </details>
        )}

        <button
          onClick={reportError}
          className="w-full mt-4 py-2 border border-white/10 rounded-lg text-xs text-white/50 hover:text-white/70 transition-colors"
        >
          <Mail className="w-3 h-3 inline mr-1" /> Reportar error
        </button>
      </motion.div>
    </motion.div>
  );
}

export function InvoicesPageWrapper() {
  return (
    <ErrorBoundary
      fallbackRender={(props) => <InvoicesPageFallback {...props} />}
    >
      <InvoicesPage />
    </ErrorBoundary>
  );
}
