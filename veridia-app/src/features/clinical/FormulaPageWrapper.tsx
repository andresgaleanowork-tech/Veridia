import React from 'react';
import { ErrorBoundary, type ErrorBoundaryFallbackProps } from '@/components/error/ErrorBoundary';
import { FormulaPage } from './FormulaPage';
import { Calculator, RefreshCw, Home, Copy, Mail } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

function FormulaPageFallback({
  error,
  requestId,
  resetError,
  isDev,
  navigate,
  copyErrorDetails,
  reportError,
}: ErrorBoundaryFallbackProps) {
  const [copied, setCopied] = React.useState(false);

  return (
    <motion.div
      initial={{"opacity": 0, "scale": 0.95}}
      animate={{"opacity": 1, "scale": 1}}
      className="min-h-screen bg-bg flex items-center justify-center p-4"
    >
      <motion.div
        initial={{"opacity": 0, "y": 20}}
        animate={{"opacity": 1, "y": 0}}
        className="glass-card max-w-lg w-full p-8 border-red-500/20"
      >
        <div className="mx-auto w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-6">
          <Calculator className="w-8 h-8 text-red-400" />
        </div>

        <h1 className="text-2xl font-bold text-text mb-2 text-center">
          Error en Calculadora de Formulas
        </h1>

        <p className="text-text-3 text-sm mb-6 text-center">
          No se pudo cargar la calculadora nutricional. Intenta recargar o contacta a soporte.
        </p>

        <AnimatePresence mode="wait">
          {requestId && (
            <motion.div
              key="request-id"
              initial={{"opacity": 0, "height": 0}}
              animate={{"opacity": 1, "height": "auto"}}
              exit={{"opacity": 0, "height": 0}}
              className="text-left bg-black/30 rounded-lg p-4 mb-6"
            >
              <div className="flex items-center justify-between mb-2">
                <p className="text-text-3 text-xs font-medium">Codigo de soporte</p>
                <button
                  onClick={copyErrorDetails}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-surface-2 border border-border rounded-lg text-text-3 hover:bg-surface-3 hover:text-text transition-colors"
                >
                  <Copy size={12} className={copied ? 'text-success' : 'text-text-3'} />
                  <span>{copied ? 'Copiado!' : 'Copiar'}</span>
                </button>
              </div>
              <div className="flex items-center gap-2">
                <code className="flex-1 font-mono text-cyan-400 text-xs break-all bg-black/20 px-2 py-1 rounded">{requestId}</code>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(requestId || '');
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-surface-2 border border-border rounded-lg text-text-3 hover:bg-surface-3 hover:text-text transition-colors"
                >
                  <Copy size={12} className={copied ? 'text-success' : 'text-text-3'} />
                  <span>{copied ? 'Copiado!' : 'Copiar ID'}</span>
                </button>
              </div>
              <p className="text-text-3 text-xs mt-2">
                Contacta a soporte tecnico con este codigo para una resolucion mas rapida.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {isDev && error && (
          <AnimatePresence mode="wait">
            <motion.div
              key="dev-error"
              initial={{"opacity": 0, "height": 0}}
              animate={{"opacity": 1, "height": "auto"}}
              exit={{"opacity": 0, "height": 0}}
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
            initial={{"opacity": 0, "y": 10}}
            animate={{"opacity": 1, "y": 0}}
            exit={{"opacity": 0, "y": -10}}
            className="flex flex-col sm:flex-row gap-3 justify-center"
          >
            <motion.button
              whileHover={{"scale": 1.02}}
              whileTap={{"scale": 0.98}}
              onClick={resetError}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/20 transition-colors font-medium"
            >
              <RefreshCw className="w-4 h-4" />
              Reintentar
            </motion.button>

            <motion.button
              whileHover={{"scale": 1.02}}
              whileTap={{"scale": 0.98}}
              onClick={reportError}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 transition-colors font-medium"
            >
              <Mail className="w-4 h-4" />
              Reportar Error
            </motion.button>

            {navigate && (
              <motion.button
                whileHover={{"scale": 1.02}}
                whileTap={{"scale": 0.98}}
                onClick={() => navigate('/')}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-white/5 border border-white/10 text-text hover:bg-white/10 transition-colors font-medium"
              >
                <Home className="w-4 h-4" />
                Ir al Dashboard
              </motion.button>
            )}
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}

export function FormulaPageWrapper() {
  return (
    <ErrorBoundary
      fallbackRender={FormulaPageFallback}
      resetKeys={["formula-page"]}
      onReset={() => { if (import.meta.env.DEV) console.log('FormulaPage error boundary reset'); }}
    >
      <FormulaPage />
    </ErrorBoundary>
  );
}
