import { type FuelKind, type RegionId, regionAt } from './feed';
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
  currency: string;
  /** "p" (pence) or "c" (cents), after a price per litre. */
  priceUnit: string;
  distanceUnit: DistanceUnit;
  economyUnit: EconomyUnit;
  fuels: readonly FuelOption[];
  /** Search areas offered, in the region's distance unit. */
  radiusOptions: readonly number[];
  /** Car fuel economy choices, in the region's economy unit. */
  economyOptions: readonly number[];
  /** "reported": each price has its own report time. "daily": prices are fixed for the day from 6am. */
  priceMode: 'reported' | 'daily';
  /** Minutes ahead of UTC on a given date (for opening hours and "today"). */
  utcOffsetMinutes: (date: Date) => number;
  source: { name: string; url: string; credit: string };
  report: { label: string; url: string; note: string };
  /** One-paragraph explanation for the About screen. */
  about: string;
  cities: readonly Place[];
}

/** Last Sunday of a month at 01:00 UTC, when UK clocks change. */
function lastSundayUtc(year: number, monthIndex: number): number {
  const lastDay = new Date(Date.UTC(year, monthIndex + 1, 0, 1));
  return lastDay.getTime() - lastDay.getUTCDay() * 86_400_000;
}

export function isBritishSummerTime(date: Date): boolean {
  const t = date.getTime();
  const year = date.getUTCFullYear();
  return t >= lastSundayUtc(year, 2) && t < lastSundayUtc(year, 9);
}

export const REGIONS: Record<RegionId, RegionInfo> = {
  wa: {
    id: 'wa',
    name: 'Western Australia',
    currency: '$',
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
  uk: {
    id: 'uk',
    name: 'United Kingdom',
    currency: '£',
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
};

/** Where Pumpwise starts before it knows better: the first region to go live. */
export const DEFAULT_REGION: RegionId = 'wa';

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
  const names = ids.map((id) => (id === 'uk' ? 'the United Kingdom' : REGIONS[id].name));
  if (names.length <= 1) return names[0] ?? REGIONS[DEFAULT_REGION].name;
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}
