/**
 * Tipos compartidos del sistema de i18n.
 *
 * Vive en su propio módulo (sin valores en runtime) para que los diccionarios
 * de `locales/` puedan tiparse sin arrastrar dependencias entre ellos: así cada
 * locale queda en un chunk independiente que Vite puede cargar bajo demanda.
 */

/** Un diccionario es namespace -> clave -> texto. */
export type LocaleDictionary = Record<string, Record<string, string>>;

/** Locales soportados por la aplicación. */
export const SUPPORTED_LOCALES = ['es', 'en', 'pt'] as const;

export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: SupportedLocale = 'es';

export function isSupportedLocale(value: unknown): value is SupportedLocale {
  return typeof value === 'string' && (SUPPORTED_LOCALES as readonly string[]).includes(value);
}
