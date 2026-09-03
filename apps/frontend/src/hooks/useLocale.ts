import { useState, useEffect } from 'react';
import type { SupportedLocale } from '@/i18n/types';
import { DEFAULT_LOCALE, isSupportedLocale } from '@/i18n/types';
import { loadDictionary } from '@/i18n';

const STORAGE_KEY = 'veridia_locale';

function detectBrowserLocale(): SupportedLocale {
  if (typeof navigator === 'undefined') return DEFAULT_LOCALE;
  const lang = navigator.language || navigator.languages?.[0] || DEFAULT_LOCALE;
  const code = lang.toLowerCase().split('-')[0];
  return isSupportedLocale(code) ? code : DEFAULT_LOCALE;
}

/**
 * Idioma inicial: preferencia guardada > idioma del navegador > castellano.
 *
 * Se exporta aparte del hook para que `main.tsx` pueda arrancar la descarga
 * del chunk correspondiente antes del primer render.
 */
export function readStoredLocale(): SupportedLocale {
  if (typeof window === 'undefined') return DEFAULT_LOCALE;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (isSupportedLocale(stored)) return stored;
  } catch {
    // ignore
  }
  return detectBrowserLocale();
}

export function useLocale(): [SupportedLocale, (locale: string) => void] {
  const [locale, setLocaleState] = useState<SupportedLocale>(readStoredLocale);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(STORAGE_KEY, locale);
    } catch {
      // ignore
    }
  }, [locale]);

  const setLocale = (newLocale: string) => {
    if (!isSupportedLocale(newLocale)) return;
    // Se pide el diccionario al cambiar de idioma para que el chunk vaya
    // llegando mientras React re-renderiza.
    void loadDictionary(newLocale);
    setLocaleState(newLocale);
  };

  return [locale, setLocale];
}
