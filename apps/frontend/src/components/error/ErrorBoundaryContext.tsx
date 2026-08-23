import React, { createContext } from 'react';

export interface ErrorBoundaryProps {
  children: React.ReactNode;
  navigate?: (path: string) => void;
  fallbackRender?: (props: ErrorBoundaryFallbackProps) => React.ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo, requestId: string) => void;
  resetKeys?: unknown[];
  onReset?: () => void;
}

export interface ErrorBoundaryFallbackProps {
  error: Error | null;
  requestId: string | null;
  resetError: () => void;
  isDev: boolean;
  navigate?: (path: string) => void;
  copyErrorDetails: () => void;
  reportError: () => void;
}

interface ErrorBoundaryContextValue {
  error: Error | null;
  requestId: string | null;
  resetError: () => void;
  hasError: boolean;
}

const ErrorBoundaryContext = createContext<ErrorBoundaryContextValue | null>(null);

export { ErrorBoundaryContext };
export type { ErrorBoundaryContextValue };