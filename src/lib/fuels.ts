import type { FuelCode } from './feed';

export interface FuelInfo {
  code: FuelCode;
  /** What drivers call it. */
  label: string;
  /** The code on the pump nozzle, shown under the label. */
  pumpCode: string;
  description: string;
  /** Shown first in onboarding and the quick fuel switcher. */
  common: boolean;
}

export const FUELS: readonly FuelInfo[] = [
  { code: 'E10', label: 'Unleaded', pumpCode: 'E10', description: 'Standard petrol', common: true },
  { code: 'E5', label: 'Super unleaded', pumpCode: 'E5', description: 'Premium petrol', common: true },
  { code: 'B7', label: 'Diesel', pumpCode: 'B7', description: 'Standard diesel', common: true },
  { code: 'SDV', label: 'Premium diesel', pumpCode: 'B7+', description: 'Super diesel', common: true },
  { code: 'B10', label: 'Diesel B10', pumpCode: 'B10', description: 'Higher-bio diesel', common: false },
  { code: 'HVO', label: 'HVO', pumpCode: 'HVO', description: 'Renewable diesel', common: false },
];

export function fuelInfo(code: FuelCode): FuelInfo {
  return FUELS.find((f) => f.code === code) ?? (FUELS[0] as FuelInfo);
}

/** "Unleaded · E10", or just "HVO" when the name already says it. */
export function fuelChipLabel(code: FuelCode): string {
  const f = fuelInfo(code);
  return f.label.includes(f.pumpCode) ? f.label : `${f.label} · ${f.pumpCode}`;
}
