import { useState, useEffect } from 'react';

const STORAGE_KEY = 'veridia_locale';
const DEFAULT_LOCALE = 'es';

function detectBrowserLocale(): string {
  if (typeof navigator === 'undefined') return DEFAULT_LOCALE;
  const lang = navigator.language || navigator.languages?.[0] || DEFAULT_LOCALE;
  const code = lang.toLowerCase().split('-')[0];
  if (code === 'en') return 'en';
  if (code === 'pt') return 'pt';
  return DEFAULT_LOCALE;
}

export function useLocale(): [string, (locale: string) => void] {
  const [locale, setLocaleState] = useState<string>(() => {
    if (typeof window === 'undefined') return DEFAULT_LOCALE;
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored === 'es' || stored === 'en' || stored === 'pt') return stored;
    } catch {
      // ignore
    }
    return detectBrowserLocale();
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(STORAGE_KEY, locale);
    } catch {
      // ignore
    }
  }, [locale]);

  const setLocale = (newLocale: string) => {
    if (newLocale === 'es' || newLocale === 'en' || newLocale === 'pt') {
      setLocaleState(newLocale);
    }
  };

  return [locale, setLocale];
}
