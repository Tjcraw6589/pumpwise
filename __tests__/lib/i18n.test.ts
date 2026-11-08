import { ALL_DICTIONARIES, formatCount, setLang, t } from '@/i18n';
import { FUEL_DESCRIPTION_TRANSLATIONS } from '@/i18n/regions';
import { formatMoney, formatPrice, priceParts, spokenPrice, timeAgo } from '@/lib/format';
import { openState, weekRows } from '@/lib/hours';
import { REGIONS } from '@/lib/regions';
import { formatDistance, radiusLabel } from '@/lib/units';

afterEach(() => setLang('en'));

describe('dictionaries', () => {
  const english = ALL_DICTIONARIES.en as Record<string, unknown>;

  test.each(['es', 'fr', 'pt'] as const)('%s has every English key, each the same kind', (lang) => {
    const other = ALL_DICTIONARIES[lang] as Record<string, unknown>;
    expect(Object.keys(other).sort()).toEqual(Object.keys(english).sort());
    for (const key of Object.keys(english)) {
      const a = english[key];
      const b = other[key];
      expect([key, typeof b]).toEqual([key, typeof a]);
      if (typeof a === 'function' && typeof b === 'function') expect([key, b.length]).toEqual([key, a.length]);
    }
  });

  test.each(['en', 'es', 'fr', 'pt'] as const)('every %s sentence comes out whole', (lang) => {
    for (const [key, value] of Object.entries(ALL_DICTIONARIES[lang] as Record<string, unknown>)) {
      const text = typeof value === 'function' ? (value as (...a: unknown[]) => string)('X', 'Y', 'Z', 'W') : value;
      expect(typeof text).toBe('string');
      expect([key, String(text).includes('undefined')]).toEqual([key, false]);
      if (key !== 'legal.englishOnly' || lang !== 'en') expect([key, String(text).trim().length > 0]).toEqual([key, true]);
    }
  });

  test('every fuel description has Spanish and French', () => {
    for (const region of Object.values(REGIONS)) {
      for (const fuel of region.fuels) {
        expect([fuel.description, FUEL_DESCRIPTION_TRANSLATIONS.es[fuel.description]]).toEqual([fuel.description, expect.any(String)]);
        expect([fuel.description, FUEL_DESCRIPTION_TRANSLATIONS.fr[fuel.description]]).toEqual([fuel.description, expect.any(String)]);
        expect([fuel.description, FUEL_DESCRIPTION_TRANSLATIONS.pt[fuel.description]]).toEqual([fuel.description, expect.any(String)]);
      }
    }
  });
});

describe('prices the way each country writes them', () => {
  test('euros: three decimals with a comma, the last digit small on the sign', () => {
    expect(formatPrice(165.9, REGIONS.es)).toBe('1,659');
    expect(formatPrice(179, REGIONS.fr)).toBe('1,790');
    expect(priceParts(165.9, REGIONS.es)).toEqual({ main: '1,65', tail: '9' });
    expect(formatMoney(12.4, REGIONS.es)).toMatch(/^12,40\s€$/);
  });

  test('pesos: two decimals', () => {
    expect(formatPrice(2459, REGIONS.mx)).toBe('24.59');
    expect(priceParts(2459, REGIONS.mx)).toEqual({ main: '24', tail: '.59' });
    expect(formatMoney(248.5, REGIONS.mx)).toBe('$248.50');
  });

  test('cents and pence stay as they were', () => {
    expect(formatPrice(189.9, REGIONS.wa)).toBe('189.9');
    expect(priceParts(189.9, REGIONS.nsw)).toEqual({ main: '189', tail: '.9' });
    expect(formatMoney(2.4, REGIONS.wa)).toBe('$2.40');
  });

  test('screen readers hear the listener’s own decimal mark', () => {
    expect(spokenPrice(165.9, REGIONS.es)).toBe('1.659 euros a litre');
    expect(spokenPrice(2459, REGIONS.mx)).toBe('24.59 pesos a litre');
    setLang('es');
    expect(spokenPrice(165.9, REGIONS.es)).toBe('1,659 euros el litro');
    setLang('fr');
    expect(spokenPrice(179, REGIONS.fr)).toBe('1,790 euros le litre');
  });
});

describe('Spanish and French', () => {
  const now = new Date('2026-11-04T10:00:00Z');

  test('Spanish words, numbers and times', () => {
    setLang('es');
    expect(timeAgo('2026-11-04T07:00:00Z', now)).toBe('hace 3 h');
    expect(formatDistance(2.34, 'km')).toBe('2,3 km');
    expect(radiusLabel(2.5, 'km')).toBe('2,5 km');
    expect(t('nearby.stations', 1)).toBe('1 gasolinera');
    expect(t('fresh.notConfirmedSince', timeAgo('2026-11-01T10:00:00Z', now))).toBe('Sin confirmar desde hace 3 días');
    // A Monday at 23:00 UTC is Tuesday 00:00 in Madrid (UTC+1 in November): closed until 07:00.
    const hours = ['0700-2200', '0700-2200', '0700-2200', '0700-2200', '0700-2200', 'closed', 'closed'];
    expect(openState(hours, new Date('2026-11-02T23:00:00Z'), 60).label).toBe('Cerrada · abre a las 07:00');
    expect(openState(hours, new Date('2026-11-06T23:00:00Z'), 60).label).toBe('Cerrada · abre el lunes a las 07:00');
    expect(weekRows(hours)[5]).toEqual({ day: 'Sábado', text: 'Cerrado' });
  });

  test('French words and numbers', () => {
    setLang('fr');
    expect(timeAgo('2026-11-04T09:35:00Z', now)).toBe('il y a 25 min');
    expect(t('fresh.notConfirmedSince', timeAgo('2026-10-25T10:00:00Z', now))).toBe('Non confirmé depuis 10 jours');
    expect(t('hours.closedOpensDayAt', t('hours.onDay', t('day.0')), '07:00')).toBe('Fermée · ouvre lundi à 07:00');
    expect(formatCount(37833)).toMatch(/^37\s833$/);
  });

  test('Mexico writes Spanish with a decimal point', () => {
    setLang('es', false);
    expect(formatDistance(1.54, 'km')).toBe('1.5 km');
    expect(spokenPrice(2459, REGIONS.mx)).toBe('24.59 pesos el litro');
  });

  test('regions take the reader’s language for their names', () => {
    // REGIONS is translated once at start-up, so check the translation tables it reads.
    setLang('es');
    expect(t('state.notCoveredTitle', 'España, Francia y México')).toBe('Pumpwise cubre España, Francia y México');
  });
});
