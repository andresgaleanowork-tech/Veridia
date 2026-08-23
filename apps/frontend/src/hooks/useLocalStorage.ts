import { useState, useEffect } from 'react';
import { captureError } from '@/lib/errorReporting';

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((prev: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') return initialValue;
    try {
      const item = window.localStorage.getItem(key);
      if (!item) return initialValue;
      const parsed = JSON.parse(item);
      if (parsed === null || parsed === undefined) return initialValue;
      return parsed as T;
    } catch (error) {
      captureError(error, { component: 'useLocalStorage', operation: 'read', additionalData: { key } });
      return initialValue;
    }
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue));
    } catch (error) {
      captureError(error, { component: 'useLocalStorage', operation: 'write', additionalData: { key } });
    }
  }, [key, storedValue]);

  const setValue = (value: T | ((prev: T) => T)): void => {
    setStoredValue((prev) => (value instanceof Function ? value(prev) : value));
  };

  return [storedValue, setValue];
}
