import { useCallback, useEffect, useState } from 'react';
import type { LocaleDictionary } from './types';
import { DEFAULT_LOCALE, isSupportedLocale } from './types';
import { getFallbackDictionary, getLoadedDictionary, loadDictionary } from './index';

type TranslationVars = Record<string, string | number>;

/**
 * Hook de traducción.
 *
 * La API pública (`const { t } = useTranslation(locale)`) es idéntica a la de
 * la versión con diccionarios estáticos, pero por debajo los idiomas
 * secundarios (en/pt) llegan en chunks bajo demanda.
 *
 * El castellano está siempre en memoria, así que el render inicial y el
 * intervalo mientras viaja otro idioma muestran texto real, nunca claves
 * crudas. Si una clave no existe, `t()` devuelve la propia clave, igual que
 * antes.
 */
export function useTranslation(locale: string = DEFAULT_LOCALE) {
  const code = isSupportedLocale(locale) ? locale : DEFAULT_LOCALE;

  // Estado inicial síncrono: el castellano está siempre en memoria, así que el
  // primer render nunca muestra claves sin traducir.
  const [dictionary, setDictionary] = useState<LocaleDictionary>(
    () => getLoadedDictionary(code) ?? getFallbackDictionary(),
  );

  useEffect(() => {
    let cancelled = false;

    const ready = getLoadedDictionary(code);
    if (ready) {
      setDictionary(ready);
      return;
    }

    // Mientras llega el idioma pedido se sigue viendo el castellano.
    setDictionary(getFallbackDictionary());

    void loadDictionary(code).then((loaded) => {
      if (!cancelled) setDictionary(loaded);
    });

    return () => {
      cancelled = true;
    };
  }, [code]);

  const t = useCallback(
    (key: string, vars?: TranslationVars): string => {
      const resolved = key.split('.').reduce<unknown>((obj, segment) => {
        if (obj && typeof obj === 'object' && segment in (obj as Record<string, unknown>)) {
          return (obj as Record<string, unknown>)[segment];
        }
        return undefined;
      }, dictionary as unknown);

      // Si la clave no existe se devuelve la propia clave, igual que antes.
      let message = typeof resolved === 'string' ? resolved : key;

      if (vars) {
        message = message.replace(/\{\{(\w+)\}\}/g, (_, match) =>
          String(vars[match] ?? `{{${match}}}`),
        );
      }

      return message;
    },
    [dictionary],
  );

  return { t, locale: code };
}
