/**
 * Carga de los diccionarios de traducción.
 *
 * Antes este fichero exportaba un objeto `translations` con los tres idiomas
 * inline (~45 kB de literales). Al ser una importación estática, los tres
 * entraban en el chunk de entrada aunque el usuario solo usara uno.
 *
 * Ahora cada locale vive en `locales/<code>.ts` y el reparto es:
 *
 * - **es** se importa de forma estática. Es el idioma por defecto y el
 *   fallback de cualquier clave ausente, así que tiene que estar disponible de
 *   forma síncrona en el primer render: si se cargara con `import()`, la UI
 *   pintaría las claves crudas (`messages.title`) durante unos milisegundos.
 * - **en** y **pt** se cargan con `import()` dinámico, así que Vite les da un
 *   chunk propio que solo se descarga si el usuario usa ese idioma.
 *
 * Resultado: se saca del bundle inicial el peso de los idiomas que no se usan
 * sin introducir parpadeo de texto sin traducir.
 */
import type { LocaleDictionary, SupportedLocale } from './types';
import { DEFAULT_LOCALE, isSupportedLocale } from './types';
import esDictionary from './locales/es';

export type { LocaleDictionary, SupportedLocale } from './types';
export { SUPPORTED_LOCALES, DEFAULT_LOCALE, isSupportedLocale } from './types';

/** Importadores perezosos de los idiomas secundarios. */
const lazyLoaders: Record<
  Exclude<SupportedLocale, 'es'>,
  () => Promise<{ default: LocaleDictionary }>
> = {
  en: () => import('./locales/en'),
  pt: () => import('./locales/pt'),
};

/** Diccionarios resueltos. El castellano ya está disponible de entrada. */
const cache = new Map<SupportedLocale, LocaleDictionary>([[DEFAULT_LOCALE, esDictionary]]);

/** Peticiones en vuelo, para no lanzar dos import() del mismo idioma. */
const inFlight = new Map<SupportedLocale, Promise<LocaleDictionary>>();

/**
 * Devuelve el diccionario si ya está en memoria, o `undefined` si aún viaja
 * por la red. Es síncrono: los componentes renderizan sin esperar.
 */
export function getLoadedDictionary(locale: string): LocaleDictionary | undefined {
  const code = isSupportedLocale(locale) ? locale : DEFAULT_LOCALE;
  return cache.get(code);
}

/** Diccionario de respaldo, siempre disponible. */
export function getFallbackDictionary(): LocaleDictionary {
  return esDictionary;
}

/** Carga (y cachea) el diccionario de un idioma. */
export function loadDictionary(locale: string): Promise<LocaleDictionary> {
  const code = isSupportedLocale(locale) ? locale : DEFAULT_LOCALE;

  const cached = cache.get(code);
  if (cached) return Promise.resolve(cached);

  const pending = inFlight.get(code);
  if (pending) return pending;

  const promise = lazyLoaders[code as Exclude<SupportedLocale, 'es'>]()
    .then((mod) => {
      cache.set(code, mod.default);
      inFlight.delete(code);
      return mod.default;
    })
    .catch(() => {
      // Si el chunk de un idioma secundario no llega (red caída, deploy nuevo),
      // se degrada al castellano en vez de romper la UI.
      inFlight.delete(code);
      return esDictionary;
    });

  inFlight.set(code, promise);
  return promise;
}
