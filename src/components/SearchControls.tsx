import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { useRegion } from '@/hooks/useRegion';
import { t } from '@/i18n';
import { fuelChipLabel } from '@/lib/regions';
import { radiusLabel, sameRadius, toKm } from '@/lib/units';
import { useStore } from '@/store/useStore';
import { useTheme } from '@/theme/useTheme';

import { Chip } from './Chip';
import { OptionSheet } from './OptionSheet';

function areaHint(km: number): string {
  if (km <= 3.5) return t('area.hintHere');
  if (km <= 8.5) return t('area.hintShort');
  if (km <= 16.5) return t('area.hintDetour');
  return t('area.hintWide');
}

/** The fuel, search-area and (optionally) place chips shown above the list and the map. */
export function SearchControls({ areaLabel, showPlace = true }: { areaLabel: string; showPlace?: boolean }) {
  const router = useRouter();
  const { spacing } = useTheme();
  const region = useRegion();
  const fuel = useStore((s) => s.settings.fuel);
  const radiusKm = useStore((s) => s.settings.radiusKm);
  const locationMode = useStore((s) => s.settings.locationMode);
  const updateSettings = useStore((s) => s.updateSettings);
  const [sheet, setSheet] = useState<'fuel' | 'radius' | null>(null);
  const closeSheet = useCallback(() => setSheet(null), []);
  const unit = region.distanceUnit;
  const selectedRadius = region.radiusOptions.find((r) => sameRadius(radiusKm, r, unit)) ?? -1;

  return (
    <>
      <View style={[styles.row, { gap: spacing.sm }]}>
        <Chip label={fuelChipLabel(region, fuel)} icon="water" picker onPress={() => setSheet('fuel')} testID="fuel-chip" />
        <Chip label={t('search.within', radiusLabel(radiusKm, unit))} icon="radio-button-on" picker onPress={() => setSheet('radius')} testID="radius-chip" />
        {showPlace ? (
          <Chip label={areaLabel} icon={locationMode === 'gps' ? 'locate' : 'map'} picker onPress={() => router.push('/place')} testID="place-chip" />
        ) : null}
      </View>
      <OptionSheet
        visible={sheet === 'fuel'}
        title={t('search.fuel')}
        value={region.fuels.some((f) => f.kind === fuel) ? fuel : (region.fuels[0]?.kind ?? fuel)}
        options={region.fuels.map((f) => ({ key: f.kind, label: f.label, detail: f.description, badge: f.pumpCode }))}
        onSelect={(key) => updateSettings({ fuel: key })}
        onClose={closeSheet}
        testID="fuel-sheet"
      />
      <OptionSheet
        visible={sheet === 'radius'}
        title={t('search.area')}
        value={selectedRadius}
        options={region.radiusOptions.map((r) => ({ key: r, label: t('search.within', radiusLabel(toKm(r, unit), unit)), detail: areaHint(toKm(r, unit)) }))}
        onSelect={(key) => updateSettings({ radiusKm: toKm(key, unit) })}
        onClose={closeSheet}
        testID="radius-sheet"
      />
    </>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' },
});
