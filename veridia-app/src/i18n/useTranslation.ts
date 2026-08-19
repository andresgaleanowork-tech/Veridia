import { useMemo } from 'react';
import { translations } from './index';

type TranslationVars = Record<string, string | number>;

export function useTranslation(locale: string = 'es') {
  return useMemo(() => {
    const dictionary = translations[locale] || translations['es'];

    function resolveKey(key: string): string {
      if (!dictionary) return key;
      return key.split('.').reduce<unknown>((obj, segment) => {
        if (obj && typeof obj === 'object' && segment in (obj as Record<string, unknown>)) {
          return (obj as Record<string, unknown>)[segment];
        }
        return undefined;
      }, dictionary as unknown) as string || key;
    }

    function t(key: string, vars?: TranslationVars): string {
      let message = resolveKey(key);
      if (vars) {
        message = message.replace(/\{\{(\w+)\}\}/g, (_, match) => {
          return String(vars[match] ?? `{{${match}}}`);
        });
      }
      return message;
    }

    return { t, locale };
  }, [locale]);
}
