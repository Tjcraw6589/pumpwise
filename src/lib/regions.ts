import { t } from '@/i18n';
import { localizeRegion } from '@/i18n/regions';

import { auEasternOffsetMinutes, type FuelKind, isEuropeanSummerTime, type RegionId, regionAt } from './feed';
import type { Place } from './places';

export interface FuelOption {
  kind: FuelKind;
  /** What drivers there call it. */
  label: string;
  /** The code on the pump, shown on price signs. */
  pumpCode: string;
  description: string;
  /** Shown in onboarding. */
  common: boolean;
}

export type DistanceUnit = 'mi' | 'km';
export type EconomyUnit = 'mpg' | 'l100';

export interface RegionInfo {
  id: RegionId;
  name: string;
  /** The symbol, for the rare place money is written by hand. */
  currency: string;
  /** ISO 4217 code, for formatting money: "AUD", "GBP", "EUR", "MXN". */
  currencyCode: string;
  /** How the region writes numbers and money ("en-AU", "es-ES", "fr-FR", "es-MX"). */
  numberLocale: string;
  /** "p" (pence) or "c" (cents), after a price per litre. */
  priceUnit: string;
  /**
   * How a price per litre is shown. Absent: hundredths with one decimal and `priceUnit` ("189.9c").
   * 3: whole currency to three decimals, as on European pumps ("€1.659"). 2: two decimals ("$24.59").
   */
  priceDecimals?: 2 | 3;
  /** Prices on the pumps use a decimal comma ("1,659"): Spain and France. */
  decimalComma?: boolean;
  distanceUnit: DistanceUnit;
  economyUnit: EconomyUnit;
  fuels: readonly FuelOption[];
  /** Search areas offered, in the region's distance unit. */
  radiusOptions: readonly number[];
  /** Car fuel economy choices, in the region's economy unit. */
  economyOptions: readonly number[];
  /**
   * "reported": each price has its own report time. "daily": prices are fixed for the day.
   * "current": the source lists the prices in force but not when they were set (Spain, Mexico).
   */
  priceMode: 'reported' | 'daily' | 'current';
  /** Local hour the price day starts, for "daily" regions. */
  priceDayStartHour?: number;
  /** "reported" regions: days before an unchanged price gets a "not confirmed" warning (default 14). */
  trustDays?: number;
  /**
   * Stations must report every price change, so a price stands until the station changes it: an
   * old price is still the current one ("Unchanged for 12 days"), not a stale one.
   */
  pricesStand?: boolean;
  /**
   * Minutes ahead of UTC on a given date (for opening hours and "today"). `lng` is the station's
   * longitude where a region spans time zones (Spain's Canary Islands are an hour behind).
   */
  utcOffsetMinutes: (date: Date, lng?: number) => number;
  source: { name: string; url: string; credit: string };
  report: { label: string; url: string; note: string };
  /** One-paragraph explanation for the About screen. */
  about: string;
  /** The name inside a sentence, where it differs ("the United Kingdom"). */
  nameInSentence?: string;
  cities: readonly Place[];
}

/** UK clocks change on the same dates as the rest of Europe. */
export const isBritishSummerTime = isEuropeanSummerTime;

/** Spain is on Central European Time, except the Canary Islands (west of 13°W), an hour behind. */
export function spainOffsetMinutes(date: Date, lng?: number): number {
  const base = lng !== undefined && lng < -12 ? 0 : 60;
  return base + (isEuropeanSummerTime(date) ? 60 : 0);
}

/** Portugal: the mainland and Madeira keep UTC in winter and UTC+1 in summer; the Azores are an hour behind. */
export function portugalOffsetMinutes(date: Date, lng?: number): number {
  const azores = typeof lng === 'number' && lng < -20;
  return (isEuropeanSummerTime(date) ? 60 : 0) - (azores ? 60 : 0);
}

/** Every region as written here, in English. The app reads `REGIONS`, in the phone's language. */
const BASE_REGIONS: Record<RegionId, RegionInfo> = {
  wa: {
    id: 'wa',
    name: 'Western Australia',
    currency: '$',
    currencyCode: 'AUD',
    numberLocale: 'en-AU',
    priceUnit: 'c',
    distanceUnit: 'km',
    economyUnit: 'l100',
    fuels: [
      { kind: 'regular', label: 'Unleaded 91', pumpCode: 'ULP', description: 'Standard unleaded', common: true },
      { kind: 'premium', label: 'Premium 95', pumpCode: 'PULP', description: 'Premium unleaded', common: true },
      { kind: 'super', label: 'Premium 98', pumpCode: '98', description: '98 RON unleaded', common: true },
      { kind: 'diesel', label: 'Diesel', pumpCode: 'DSL', description: 'Standard diesel', common: true },
      { kind: 'premium-diesel', label: 'Premium diesel', pumpCode: 'PDSL', description: 'Branded diesel', common: false },
      { kind: 'lpg', label: 'LPG', pumpCode: 'LPG', description: 'Autogas', common: false },
      { kind: 'e85', label: 'E85', pumpCode: 'E85', description: 'Ethanol blend', common: false },
    ],
    radiusOptions: [2, 3, 5, 8, 10, 15, 25, 40],
    economyOptions: [5, 6, 7, 8, 9, 10, 11, 12, 14],
    priceMode: 'daily',
    priceDayStartHour: 6,
    utcOffsetMinutes: () => 8 * 60,
    source: {
      name: 'FuelWatch',
      url: 'https://www.fuelwatch.wa.gov.au',
      credit: 'Prices from FuelWatch, Government of Western Australia',
    },
    report: {
      label: 'Contact FuelWatch',
      url: 'https://www.fuelwatch.wa.gov.au/contact',
      note: 'WA stations must sell at the price they set for the day.',
    },
    about:
      "In Western Australia every station must tell FuelWatch its price for the next day by 2pm. Prices are then fixed for 24 hours from 6am, so you know today's price and, after 2:30pm, tomorrow's.",
    cities: [
      { name: 'Perth', detail: 'Western Australia', lat: -31.9523, lng: 115.8613 },
      { name: 'Fremantle', detail: 'Western Australia', lat: -32.0569, lng: 115.7439 },
      { name: 'Joondalup', detail: 'Western Australia', lat: -31.7448, lng: 115.7661 },
      { name: 'Mandurah', detail: 'Western Australia', lat: -32.5269, lng: 115.7217 },
      { name: 'Bunbury', detail: 'Western Australia', lat: -33.3271, lng: 115.6414 },
      { name: 'Geraldton', detail: 'Western Australia', lat: -28.7774, lng: 114.6149 },
      { name: 'Albany', detail: 'Western Australia', lat: -35.0269, lng: 117.8837 },
      { name: 'Kalgoorlie', detail: 'Western Australia', lat: -30.7489, lng: 121.4658 },
      { name: 'Broome', detail: 'Western Australia', lat: -17.9614, lng: 122.2359 },
    ],
  },
  nsw: {
    id: 'nsw',
    name: 'New South Wales',
    currency: '$',
    currencyCode: 'AUD',
    numberLocale: 'en-AU',
    priceUnit: 'c',
    distanceUnit: 'km',
    economyUnit: 'l100',
    fuels: [
      { kind: 'regular', label: 'Unleaded 91', pumpCode: 'U91', description: 'Standard unleaded', common: true },
      { kind: 'e10', label: 'E10', pumpCode: 'E10', description: '94 octane with 10% ethanol', common: true },
      { kind: 'premium', label: 'Premium 95', pumpCode: 'P95', description: 'Premium unleaded', common: true },
      { kind: 'super', label: 'Premium 98', pumpCode: 'P98', description: '98 octane unleaded', common: true },
      { kind: 'diesel', label: 'Diesel', pumpCode: 'DL', description: 'Standard diesel', common: true },
      { kind: 'premium-diesel', label: 'Premium diesel', pumpCode: 'PDL', description: 'Branded diesel', common: false },
      { kind: 'lpg', label: 'LPG', pumpCode: 'LPG', description: 'Autogas', common: false },
      { kind: 'e85', label: 'E85', pumpCode: 'E85', description: 'Ethanol blend', common: false },
      { kind: 'b20', label: 'Biodiesel', pumpCode: 'B20', description: 'Diesel with 20% biodiesel', common: false },
    ],
    radiusOptions: [2, 3, 5, 8, 10, 15, 25, 40],
    economyOptions: [5, 6, 7, 8, 9, 10, 11, 12, 14],
    priceMode: 'reported',
    trustDays: 30,
    pricesStand: true,
    utcOffsetMinutes: auEasternOffsetMinutes,
    source: {
      name: 'FuelCheck',
      url: 'https://www.fuelcheck.nsw.gov.au',
      credit: 'Prices from FuelCheck, NSW Government (CC BY-SA 3.0 AU)',
    },
    report: {
      label: 'Report it in FuelCheck',
      url: 'https://www.fuelcheck.nsw.gov.au/app',
      note: 'NSW stations must sell at the price they report to FuelCheck.',
    },
    about:
      "In New South Wales and the ACT every station must report its prices to FuelCheck, and the price at the pump must match. A price stands until the station reports a new one. Pumpwise collects them about every 45 minutes.",
    cities: [
      { name: 'Sydney', detail: 'New South Wales', lat: -33.8688, lng: 151.2093 },
      { name: 'Parramatta', detail: 'New South Wales', lat: -33.815, lng: 151.0011 },
      { name: 'Newcastle', detail: 'New South Wales', lat: -32.9283, lng: 151.7817 },
      { name: 'Wollongong', detail: 'New South Wales', lat: -34.4278, lng: 150.8931 },
      { name: 'Gosford', detail: 'New South Wales', lat: -33.425, lng: 151.342 },
      { name: 'Canberra', detail: 'Australian Capital Territory', lat: -35.2809, lng: 149.13 },
      { name: 'Wagga Wagga', detail: 'New South Wales', lat: -35.1082, lng: 147.3598 },
      { name: 'Albury', detail: 'New South Wales', lat: -36.0737, lng: 146.9135 },
      { name: 'Coffs Harbour', detail: 'New South Wales', lat: -30.2963, lng: 153.1135 },
      { name: 'Port Macquarie', detail: 'New South Wales', lat: -31.4333, lng: 152.9 },
      { name: 'Tamworth', detail: 'New South Wales', lat: -31.0927, lng: 150.932 },
      { name: 'Orange', detail: 'New South Wales', lat: -33.284, lng: 149.1004 },
      { name: 'Dubbo', detail: 'New South Wales', lat: -32.2569, lng: 148.6011 },
    ],
  },
  tas: {
    id: 'tas',
    name: 'Tasmania',
    currency: '$',
    currencyCode: 'AUD',
    numberLocale: 'en-AU',
    priceUnit: 'c',
    distanceUnit: 'km',
    economyUnit: 'l100',
    fuels: [
      { kind: 'regular', label: 'Unleaded 91', pumpCode: 'U91', description: 'Standard unleaded', common: true },
      { kind: 'premium', label: 'Premium 95', pumpCode: 'P95', description: 'Premium unleaded', common: true },
      { kind: 'super', label: 'Premium 98', pumpCode: 'P98', description: '98 octane unleaded', common: true },
      { kind: 'diesel', label: 'Diesel', pumpCode: 'DL', description: 'Standard diesel', common: true },
      { kind: 'premium-diesel', label: 'Premium diesel', pumpCode: 'PDL', description: 'Branded diesel', common: false },
      { kind: 'e10', label: 'E10', pumpCode: 'E10', description: '94 octane with 10% ethanol', common: false },
      { kind: 'lpg', label: 'LPG', pumpCode: 'LPG', description: 'Autogas', common: false },
    ],
    radiusOptions: [2, 3, 5, 8, 10, 15, 25, 40],
    economyOptions: [5, 6, 7, 8, 9, 10, 11, 12, 14],
    priceMode: 'reported',
    trustDays: 30,
    pricesStand: true,
    utcOffsetMinutes: auEasternOffsetMinutes,
    source: {
      name: 'FuelCheck TAS',
      url: 'https://www.fuelcheck.tas.gov.au',
      credit: 'Prices from FuelCheck TAS, Tasmanian Government',
    },
    report: {
      label: 'Visit FuelCheck TAS',
      url: 'https://www.fuelcheck.tas.gov.au/app',
      note: 'Tasmanian stations report their prices to FuelCheck TAS.',
    },
    about:
      'Tasmanian stations report their prices to FuelCheck TAS. A price stands until the station reports a new one. Pumpwise collects them about every 45 minutes.',
    cities: [
      { name: 'Hobart', detail: 'Tasmania', lat: -42.8821, lng: 147.3272 },
      { name: 'Launceston', detail: 'Tasmania', lat: -41.4332, lng: 147.1441 },
      { name: 'Devonport', detail: 'Tasmania', lat: -41.18, lng: 146.35 },
      { name: 'Burnie', detail: 'Tasmania', lat: -41.0526, lng: 145.906 },
    ],
  },
  qld: {
    id: 'qld',
    name: 'Queensland',
    currency: '$',
    currencyCode: 'AUD',
    numberLocale: 'en-AU',
    priceUnit: 'c',
    distanceUnit: 'km',
    economyUnit: 'l100',
    fuels: [
      { kind: 'regular', label: 'Unleaded 91', pumpCode: 'U91', description: 'Standard unleaded', common: true },
      { kind: 'e10', label: 'E10', pumpCode: 'E10', description: '94 octane with 10% ethanol', common: true },
      { kind: 'premium', label: 'Premium 95', pumpCode: 'P95', description: 'Premium unleaded', common: true },
      { kind: 'super', label: 'Premium 98', pumpCode: 'P98', description: '98 octane unleaded', common: true },
      { kind: 'diesel', label: 'Diesel', pumpCode: 'DL', description: 'Standard diesel', common: true },
      { kind: 'premium-diesel', label: 'Premium diesel', pumpCode: 'PDL', description: 'Branded diesel', common: false },
      { kind: 'lpg', label: 'LPG', pumpCode: 'LPG', description: 'Autogas', common: false },
      { kind: 'e85', label: 'E85', pumpCode: 'E85', description: 'Ethanol blend', common: false },
    ],
    radiusOptions: [2, 3, 5, 8, 10, 15, 25, 40],
    economyOptions: [5, 6, 7, 8, 9, 10, 11, 12, 14],
    priceMode: 'reported',
    trustDays: 30,
    pricesStand: true,
    utcOffsetMinutes: () => 10 * 60,
    source: {
      name: 'Fuel Prices QLD',
      url: 'https://www.fuelpricesqld.com.au',
      credit: 'Based on data provided by the State of Queensland (Department of Energy and Climate) 2026',
    },
    report: {
      label: 'Contact the Queensland Government',
      url: 'https://www.epw.qld.gov.au/about/initiatives/fuel-price-reporting',
      note: 'Queensland stations must report price changes within 30 minutes.',
    },
    about:
      'Queensland stations must report every price change to the Queensland Government within 30 minutes. A price stands until the station reports a new one. The State gives no warranty in relation to the data and accepts no liability for any use of it.',
    cities: [
      { name: 'Brisbane', detail: 'Queensland', lat: -27.4698, lng: 153.0251 },
      { name: 'Gold Coast', detail: 'Queensland', lat: -28.0167, lng: 153.4 },
      { name: 'Sunshine Coast', detail: 'Queensland', lat: -26.65, lng: 153.0667 },
      { name: 'Ipswich', detail: 'Queensland', lat: -27.6144, lng: 152.7608 },
      { name: 'Toowoomba', detail: 'Queensland', lat: -27.5598, lng: 151.9507 },
      { name: 'Bundaberg', detail: 'Queensland', lat: -24.8661, lng: 152.3489 },
      { name: 'Rockhampton', detail: 'Queensland', lat: -23.3791, lng: 150.5100 },
      { name: 'Mackay', detail: 'Queensland', lat: -21.1411, lng: 149.1861 },
      { name: 'Townsville', detail: 'Queensland', lat: -19.259, lng: 146.8169 },
      { name: 'Cairns', detail: 'Queensland', lat: -16.9186, lng: 145.7781 },
    ],
  },
  uk: {
    id: 'uk',
    name: 'United Kingdom',
    nameInSentence: 'the United Kingdom',
    currency: '£',
    currencyCode: 'GBP',
    numberLocale: 'en-GB',
    priceUnit: 'p',
    distanceUnit: 'mi',
    economyUnit: 'mpg',
    fuels: [
      { kind: 'regular', label: 'Unleaded', pumpCode: 'E10', description: 'Standard petrol', common: true },
      { kind: 'premium', label: 'Super unleaded', pumpCode: 'E5', description: 'Premium petrol', common: true },
      { kind: 'diesel', label: 'Diesel', pumpCode: 'B7', description: 'Standard diesel', common: true },
      { kind: 'premium-diesel', label: 'Premium diesel', pumpCode: 'B7+', description: 'Super diesel', common: true },
      { kind: 'b10', label: 'Diesel B10', pumpCode: 'B10', description: 'Higher-bio diesel', common: false },
      { kind: 'hvo', label: 'HVO', pumpCode: 'HVO', description: 'Renewable diesel', common: false },
    ],
    radiusOptions: [1, 2, 3, 5, 10, 15, 25],
    economyOptions: [25, 30, 35, 40, 45, 50, 55, 60, 65, 70],
    priceMode: 'reported',
    utcOffsetMinutes: (date) => (isBritishSummerTime(date) ? 60 : 0),
    source: {
      name: 'Fuel Finder',
      url: 'https://www.gov.uk/government/collections/fuel-finder',
      credit: 'Prices from the UK Government Fuel Finder scheme (Open Government Licence v3.0)',
    },
    report: {
      label: 'Report it to GOV.UK',
      url: 'https://www.gov.uk/guidance/report-an-error-in-fuel-prices-or-forecourt-details',
      note: 'Forecourts must report price changes within 30 minutes.',
    },
    about:
      'Since February 2026 every UK forecourt must report its prices to the Fuel Finder scheme, and report any change within 30 minutes.',
    cities: [
      { name: 'London', detail: 'United Kingdom', lat: 51.5072, lng: -0.1276 },
      { name: 'Manchester', detail: 'United Kingdom', lat: 53.4808, lng: -2.2426 },
      { name: 'Birmingham', detail: 'United Kingdom', lat: 52.4862, lng: -1.8904 },
      { name: 'Glasgow', detail: 'United Kingdom', lat: 55.8642, lng: -4.2518 },
    ],
  },
  es: {
    id: 'es',
    name: 'Spain',
    currency: '€',
    currencyCode: 'EUR',
    numberLocale: 'es-ES',
    priceUnit: 'c',
    priceDecimals: 3,
    decimalComma: true,
    distanceUnit: 'km',
    economyUnit: 'l100',
    fuels: [
      { kind: 'regular', label: 'Gasolina 95', pumpCode: '95', description: 'Unleaded 95 (E5)', common: true },
      { kind: 'diesel', label: 'Diésel', pumpCode: 'A', description: 'Gasóleo A, standard diesel', common: true },
      { kind: 'super', label: 'Gasolina 98', pumpCode: '98', description: 'Unleaded 98', common: true },
      { kind: 'premium-diesel', label: 'Diésel Premium', pumpCode: 'A+', description: 'Premium diesel', common: true },
      { kind: 'premium', label: 'Gasolina 95 Premium', pumpCode: '95+', description: 'Premium unleaded 95', common: false },
      { kind: 'e10', label: 'Gasolina 95 E10', pumpCode: 'E10', description: 'Unleaded 95 with 10% ethanol', common: false },
      { kind: 'lpg', label: 'Autogás (GLP)', pumpCode: 'GLP', description: 'Liquefied petroleum gas', common: false },
      { kind: 'e85', label: 'E85', pumpCode: 'E85', description: 'Ethanol blend', common: false },
      { kind: 'hvo', label: 'Diésel renovable', pumpCode: 'HVO', description: 'Renewable diesel', common: false },
    ],
    radiusOptions: [2, 3, 5, 8, 10, 15, 25, 40],
    economyOptions: [4, 5, 6, 7, 8, 9, 10, 12],
    // The Ministry's list gives the prices in force when it was published, not when each was set.
    priceMode: 'current',
    utcOffsetMinutes: spainOffsetMinutes,
    source: {
      name: 'Geoportal de Gasolineras',
      url: 'https://geoportalgasolineras.es',
      credit: 'Prices from MITECO’s Geoportal de Gasolineras, Government of Spain (CC BY 4.0)',
    },
    report: {
      label: 'Check it on the Geoportal',
      url: 'https://geoportalgasolineras.es',
      note: 'Spanish stations must report their prices to the Ministry whenever they change.',
    },
    about:
      'In Spain every station must report its prices to the Ministry for the Ecological Transition whenever they change. The Ministry publishes them every half hour, and Pumpwise collects them about every 30 minutes.',
    cities: [
      { name: 'Madrid', detail: 'Spain', lat: 40.4168, lng: -3.7038 },
      { name: 'Barcelona', detail: 'Spain', lat: 41.3874, lng: 2.1686 },
      { name: 'Valencia', detail: 'Spain', lat: 39.4699, lng: -0.3763 },
      { name: 'Sevilla', detail: 'Spain', lat: 37.3891, lng: -5.9845 },
      { name: 'Zaragoza', detail: 'Spain', lat: 41.6488, lng: -0.8891 },
      { name: 'Málaga', detail: 'Spain', lat: 36.7213, lng: -4.4214 },
      { name: 'Murcia', detail: 'Spain', lat: 37.9922, lng: -1.1307 },
      { name: 'Palma', detail: 'Spain', lat: 39.5696, lng: 2.6502 },
      { name: 'Bilbao', detail: 'Spain', lat: 43.263, lng: -2.935 },
      { name: 'Alicante', detail: 'Spain', lat: 38.3452, lng: -0.481 },
      { name: 'Valladolid', detail: 'Spain', lat: 41.6523, lng: -4.7245 },
      { name: 'Vigo', detail: 'Spain', lat: 42.2406, lng: -8.7207 },
      { name: 'A Coruña', detail: 'Spain', lat: 43.3623, lng: -8.4115 },
      { name: 'Granada', detail: 'Spain', lat: 37.1773, lng: -3.5986 },
      { name: 'Las Palmas de Gran Canaria', detail: 'Spain', lat: 28.1235, lng: -15.4363 },
      { name: 'Santa Cruz de Tenerife', detail: 'Spain', lat: 28.4636, lng: -16.2518 },
    ],
  },
  fr: {
    id: 'fr',
    name: 'France',
    currency: '€',
    currencyCode: 'EUR',
    numberLocale: 'fr-FR',
    priceUnit: 'c',
    priceDecimals: 3,
    decimalComma: true,
    distanceUnit: 'km',
    economyUnit: 'l100',
    fuels: [
      { kind: 'regular', label: 'SP95-E10', pumpCode: 'E10', description: 'Unleaded 95 with up to 10% ethanol', common: true },
      { kind: 'diesel', label: 'Gazole', pumpCode: 'B7', description: 'Standard diesel', common: true },
      { kind: 'premium', label: 'SP95', pumpCode: 'E5', description: 'Unleaded 95', common: true },
      { kind: 'super', label: 'SP98', pumpCode: 'E5', description: 'Unleaded 98', common: true },
      { kind: 'e85', label: 'E85', pumpCode: 'E85', description: 'Superethanol', common: false },
      { kind: 'lpg', label: 'GPLc', pumpCode: 'LPG', description: 'Autogas', common: false },
    ],
    radiusOptions: [2, 3, 5, 8, 10, 15, 25, 40],
    economyOptions: [4, 5, 6, 7, 8, 9, 10, 12],
    priceMode: 'reported',
    trustDays: 30,
    pricesStand: true,
    utcOffsetMinutes: (date) => 60 + (isEuropeanSummerTime(date) ? 60 : 0),
    source: {
      name: 'prix-carburants.gouv.fr',
      url: 'https://www.prix-carburants.gouv.fr',
      credit: 'Prices from prix-carburants.gouv.fr, French Ministry of the Economy (Licence Ouverte 2.0)',
    },
    report: {
      label: 'Check it on prix-carburants.gouv.fr',
      url: 'https://www.prix-carburants.gouv.fr',
      note: 'French stations must report every price change to the government.',
    },
    about:
      'In France every station must report its prices to the government whenever they change, and the price at the pump must match. Pumpwise collects them about every 15 minutes. The government list has no brand names, so stations are shown by their address.',
    cities: [
      { name: 'Paris', detail: 'France', lat: 48.8566, lng: 2.3522 },
      { name: 'Marseille', detail: 'France', lat: 43.2965, lng: 5.3698 },
      { name: 'Lyon', detail: 'France', lat: 45.764, lng: 4.8357 },
      { name: 'Toulouse', detail: 'France', lat: 43.6047, lng: 1.4442 },
      { name: 'Nice', detail: 'France', lat: 43.7102, lng: 7.262 },
      { name: 'Nantes', detail: 'France', lat: 47.2184, lng: -1.5536 },
      { name: 'Montpellier', detail: 'France', lat: 43.6108, lng: 3.8767 },
      { name: 'Strasbourg', detail: 'France', lat: 48.5734, lng: 7.7521 },
      { name: 'Bordeaux', detail: 'France', lat: 44.8378, lng: -0.5792 },
      { name: 'Lille', detail: 'France', lat: 50.6292, lng: 3.0573 },
      { name: 'Rennes', detail: 'France', lat: 48.1173, lng: -1.6778 },
      { name: 'Reims', detail: 'France', lat: 49.2583, lng: 4.0317 },
      { name: 'Grenoble', detail: 'France', lat: 45.1885, lng: 5.7245 },
      { name: 'Dijon', detail: 'France', lat: 47.322, lng: 5.0415 },
      { name: 'Rouen', detail: 'France', lat: 49.4432, lng: 1.0999 },
      { name: 'Ajaccio', detail: 'France', lat: 41.9192, lng: 8.7386 },
    ],
  },
  mx: {
    id: 'mx',
    name: 'Mexico',
    currency: '$',
    currencyCode: 'MXN',
    numberLocale: 'es-MX',
    priceUnit: 'c',
    priceDecimals: 2,
    distanceUnit: 'km',
    economyUnit: 'l100',
    fuels: [
      { kind: 'regular', label: 'Magna', pumpCode: '87', description: 'Regular unleaded', common: true },
      { kind: 'premium', label: 'Premium', pumpCode: '91', description: 'Premium unleaded', common: true },
      { kind: 'diesel', label: 'Diésel', pumpCode: 'DSL', description: 'Diesel', common: true },
    ],
    radiusOptions: [2, 3, 5, 8, 10, 15, 25, 40],
    economyOptions: [5, 6, 7, 8, 9, 10, 12, 14],
    priceMode: 'current',
    // Mexico City time; the CRE list has no opening hours, so this only marks the day.
    utcOffsetMinutes: () => -6 * 60,
    source: {
      name: 'Comisión Nacional de Energía',
      url: 'https://www.gob.mx/cne',
      credit: 'Prices reported to the Comisión Nacional de Energía (CNE, formerly CRE), Government of Mexico (CC BY 4.0)',
    },
    report: {
      label: 'Report it to PROFECO',
      url: 'https://www.gob.mx/profeco',
      note: 'Stations report their prices to the CNE; PROFECO handles complaints at the pump.',
    },
    about:
      'In Mexico fuel stations report their prices to the Comisión Nacional de Energía (CNE, formerly the CRE), which publishes them as open data. The list gives the prices in force but not when each was set, so Pumpwise shows them as current prices and the date they were collected.',
    cities: [
      { name: 'Ciudad de México', detail: 'Mexico', lat: 19.4326, lng: -99.1332 },
      { name: 'Guadalajara', detail: 'Mexico', lat: 20.6597, lng: -103.3496 },
      { name: 'Monterrey', detail: 'Mexico', lat: 25.6866, lng: -100.3161 },
      { name: 'Puebla', detail: 'Mexico', lat: 19.0414, lng: -98.2063 },
      { name: 'Tijuana', detail: 'Mexico', lat: 32.5149, lng: -117.0382 },
      { name: 'León', detail: 'Mexico', lat: 21.1219, lng: -101.6826 },
      { name: 'Querétaro', detail: 'Mexico', lat: 20.5888, lng: -100.3899 },
      { name: 'Mérida', detail: 'Mexico', lat: 20.9674, lng: -89.5926 },
      { name: 'Cancún', detail: 'Mexico', lat: 21.1619, lng: -86.8515 },
      { name: 'Toluca', detail: 'Mexico', lat: 19.2826, lng: -99.6557 },
      { name: 'Chihuahua', detail: 'Mexico', lat: 28.6353, lng: -106.0889 },
      { name: 'Aguascalientes', detail: 'Mexico', lat: 21.8853, lng: -102.2916 },
    ],
  },
  pt: {
    id: 'pt',
    name: 'Portugal',
    currency: '€',
    currencyCode: 'EUR',
    numberLocale: 'pt-PT',
    decimalComma: true,
    priceUnit: 'c',
    priceDecimals: 3,
    distanceUnit: 'km',
    economyUnit: 'l100',
    fuels: [
      { kind: 'regular', label: 'Gasolina 95', pumpCode: '95', description: 'Unleaded 95', common: true },
      { kind: 'diesel', label: 'Gasóleo', pumpCode: 'B7', description: 'Standard diesel', common: true },
      { kind: 'premium', label: 'Gasolina 95 aditivada', pumpCode: '95+', description: 'Premium unleaded 95', common: true },
      { kind: 'super', label: 'Gasolina 98', pumpCode: '98', description: 'Unleaded 98', common: true },
      { kind: 'premium-diesel', label: 'Gasóleo aditivado', pumpCode: 'B7+', description: 'Premium diesel', common: true },
      { kind: 'lpg', label: 'GPL Auto', pumpCode: 'GPL', description: 'Autogas', common: false },
    ],
    radiusOptions: [2, 3, 5, 8, 10, 15, 25, 40],
    economyOptions: [4, 5, 6, 7, 8, 9, 10, 12],
    priceMode: 'reported',
    trustDays: 30,
    pricesStand: true,
    utcOffsetMinutes: portugalOffsetMinutes,
    source: {
      name: 'DGEG Preços dos Combustíveis',
      url: 'https://precoscombustiveis.dgeg.gov.pt',
      credit: 'Prices from the Direção-Geral de Energia e Geologia (DGEG), Government of Portugal',
    },
    report: {
      label: 'Check it on precoscombustiveis.dgeg.gov.pt',
      url: 'https://precoscombustiveis.dgeg.gov.pt',
      note: 'Stations enter their own prices on the DGEG site. Write to precoscombustiveis@dgeg.gov.pt about a wrong one.',
    },
    about:
      'In Portugal station operators publish their prices on the DGEG’s price service whenever they change. A price stands until the station enters a new one; Pumpwise collects them about every 30 minutes and shows when each was last updated.',
    cities: [
      { name: 'Lisboa', detail: 'Portugal', lat: 38.7223, lng: -9.1393 },
      { name: 'Porto', detail: 'Portugal', lat: 41.1579, lng: -8.6291 },
      { name: 'Braga', detail: 'Portugal', lat: 41.5454, lng: -8.4265 },
      { name: 'Coimbra', detail: 'Portugal', lat: 40.2033, lng: -8.4103 },
      { name: 'Faro', detail: 'Portugal', lat: 37.0194, lng: -7.9322 },
      { name: 'Setúbal', detail: 'Portugal', lat: 38.5244, lng: -8.8882 },
      { name: 'Aveiro', detail: 'Portugal', lat: 40.6405, lng: -8.6538 },
      { name: 'Leiria', detail: 'Portugal', lat: 39.7436, lng: -8.8071 },
      { name: 'Évora', detail: 'Portugal', lat: 38.5667, lng: -7.9 },
      { name: 'Viseu', detail: 'Portugal', lat: 40.6566, lng: -7.9125 },
      { name: 'Funchal', detail: 'Madeira', lat: 32.6669, lng: -16.9241 },
      { name: 'Ponta Delgada', detail: 'Açores', lat: 37.7412, lng: -25.6756 },
    ],
  },
};

/** Every region, with its names and explanations in the phone's language. */
export const REGIONS: Record<RegionId, RegionInfo> = Object.fromEntries(
  Object.entries(BASE_REGIONS).map(([id, info]) => [id, localizeRegion(info)]),
) as Record<RegionId, RegionInfo>;

/** Where Pumpwise starts before it knows better: the first region to go live. */
export const DEFAULT_REGION: RegionId = 'wa';

/** The country each region is in (ISO 3166 code), for headings when places from several countries are listed. */
export const REGION_COUNTRY: Record<RegionId, 'AU' | 'ES' | 'FR' | 'MX' | 'PT' | 'GB'> = {
  wa: 'AU',
  nsw: 'AU',
  tas: 'AU',
  qld: 'AU',
  uk: 'GB',
  es: 'ES',
  fr: 'FR',
  mx: 'MX',
  pt: 'PT',
};

/** "Western Australia · Australia", or just "Spain" where the region is the whole country. */
export function regionHeading(id: RegionId): string {
  const region = REGIONS[id].name;
  const country = t(`country.${REGION_COUNTRY[id]}`);
  return region === country ? region : `${region} · ${country}`;
}

/** Covered regions with the one the user is in (if any) first, then in the usual order. */
export function regionsHereFirst(live: readonly RegionId[], here: RegionId | null): RegionId[] {
  return here && live.includes(here) ? [here, ...live.filter((id) => id !== here)] : [...live];
}

/**
 * The regions this version of the app expects to be live, used for wording before the feed has
 * loaded (the welcome screens). Keep it in step with the feed's sources.
 */
export const EXPECTED_REGIONS: readonly RegionId[] = ['wa', 'nsw', 'tas', 'es', 'fr', 'mx', 'pt'];

export function regionInfo(id: RegionId | null | undefined): RegionInfo {
  return REGIONS[id ?? DEFAULT_REGION];
}

export function regionInfoAt(lat: number, lng: number): RegionInfo | null {
  const id = regionAt(lat, lng);
  return id ? REGIONS[id] : null;
}

/** The region's option for a fuel kind, or its first fuel when it doesn't sell that kind. */
export function fuelOption(region: RegionInfo, kind: FuelKind): FuelOption {
  return region.fuels.find((f) => f.kind === kind) ?? (region.fuels[0] as FuelOption);
}

/** "Unleaded 91 · ULP", or just "LPG" when the name already says it. */
export function fuelChipLabel(region: RegionInfo, kind: FuelKind): string {
  const f = fuelOption(region, kind);
  return f.label.includes(f.pumpCode) ? f.label : `${f.label} · ${f.pumpCode}`;
}

/** Names of live regions, joined for a sentence: "Western Australia and the United Kingdom". */
export function regionList(ids: readonly RegionId[]): string {
  const names = ids.map((id) => REGIONS[id].nameInSentence ?? REGIONS[id].name);
  if (names.length <= 1) return names[0] ?? REGIONS[DEFAULT_REGION].name;
  return t('list.join', names.slice(0, -1).join(', '), names[names.length - 1] as string);
}
