/**
 * The words Pumpwise shows, in the phone's language: English, Spanish or French, with English as the
 * fallback. Every dictionary has the same keys (the type system checks), and a value is either the
 * text or a small function where numbers or names go inside a sentence, so each language can order
 * the words its own way.
 *
 * The language is read once at start-up: iOS restarts an app when its language changes.
 */
import { getLocales } from 'expo-localization';

import { en, type Strings } from './en';
import { es } from './es';
import { fr } from './fr';

export type Lang = 'en' | 'es' | 'fr';

const DICTIONARIES: Record<Lang, Strings> = { en, es, fr };

interface Reader {
  lang: Lang;
  /** How the reader's region writes numbers: Spain and France "2,3", Mexico and Australia "2.3". */
  comma: boolean;
  /** The reader's own locale, for thousands separators ("es-MX", "fr-FR"). */
  tag: string;
}

const DEFAULT_TAG: Record<Lang, string> = { en: 'en-AU', es: 'es-ES', fr: 'fr-FR' };

/** The first of the phone's preferred languages that Pumpwise speaks, or English, with its number style. */
function detectReader(): Reader {
  try {
    for (const locale of getLocales()) {
      const code = locale.languageCode?.toLowerCase();
      if (code === 'en' || code === 'es' || code === 'fr') {
        const comma = locale.decimalSeparator ? locale.decimalSeparator === ',' : code !== 'en';
        return { lang: code, comma, tag: locale.languageTag || DEFAULT_TAG[code] };
      }
    }
  } catch {
    // No locale information (some test and web environments): English.
  }
  return { lang: 'en', comma: false, tag: DEFAULT_TAG.en };
}

let reader: Reader = detectReader();
let current: Lang = reader.lang;

export function detectLang(): Lang {
  return detectReader().lang;
}

export function lang(): Lang {
  return current;
}

/** For tests and previews: switch the language for the rest of the session, with Spain's or France's number style. */
export function setLang(next: Lang, comma = next !== 'en'): void {
  current = next;
  reader = { lang: next, comma, tag: DEFAULT_TAG[next] };
}

type Args<V> = V extends (...args: infer A) => string ? A : [];

/** The text for a key in the current language: `t('nearby.allNearby')`, `t('time.minAgo', 12)`. */
export function t<K extends keyof Strings>(key: K, ...args: Args<Strings[K]>): string {
  const value = DICTIONARIES[current][key] as string | ((...a: unknown[]) => string);
  return typeof value === 'function' ? value(...args) : value;
}

/** Keys whose text takes no arguments, for tables of labels (sort options, station tags). */
export type PlainKey = { [K in keyof Strings]: Strings[K] extends string ? K : never }[keyof Strings];

/** Whether the reader writes decimals with a comma: "2,3 km" in Spain and France, "2.3 km" in Mexico. */
export function decimalComma(): boolean {
  return reader.comma;
}

/** A number already written with a dot ("2.3"), in the reader's own style ("2,3"). */
export function localNumber(text: string): string {
  return decimalComma() ? text.replace('.', ',') : text;
}

/** A whole number with the reader's thousands separator: "37,833", "37.833", "37 833". */
export function formatCount(n: number): string {
  try {
    return n.toLocaleString(reader.tag);
  } catch {
    return String(n);
  }
}

/** The phone's country ("ES", "AU") from its region setting, or null when unknown. */
export function deviceCountry(): string | null {
  try {
    for (const locale of getLocales()) {
      if (locale.regionCode) return locale.regionCode.toUpperCase();
    }
  } catch {
    // No locale information.
  }
  return null;
}

/** Every dictionary, for the test that checks they agree. */
export const ALL_DICTIONARIES = DICTIONARIES;
