import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { fuelChipLabel, FUELS } from '@/lib/fuels';
import { RADIUS_OPTIONS, useStore } from '@/store/useStore';
import { useTheme } from '@/theme/useTheme';

import { Chip } from './Chip';
import { OptionSheet } from './OptionSheet';

/** The fuel, search-area and (optionally) place chips shown above the list and the map. */
export function SearchControls({ areaLabel, showPlace = true }: { areaLabel: string; showPlace?: boolean }) {
  const router = useRouter();
  const { spacing } = useTheme();
  const fuel = useStore((s) => s.settings.fuel);
  const radiusMiles = useStore((s) => s.settings.radiusMiles);
  const locationMode = useStore((s) => s.settings.locationMode);
  const updateSettings = useStore((s) => s.updateSettings);
  const [sheet, setSheet] = useState<'fuel' | 'radius' | null>(null);

  return (
    <>
      <View style={[styles.row, { gap: spacing.sm }]}>
        <Chip
          label={fuelChipLabel(fuel)}
          icon="water"
          picker
          onPress={() => setSheet('fuel')}
          testID="fuel-chip"
        />
        <Chip label={`Within ${radiusMiles} mi`} icon="radio-button-on" picker onPress={() => setSheet('radius')} testID="radius-chip" />
        {showPlace ? (
          <Chip
            label={areaLabel}
            icon={locationMode === 'gps' ? 'locate' : 'map'}
            picker
            onPress={() => router.push('/place')}
            testID="place-chip"
          />
        ) : null}
      </View>
      <OptionSheet
        visible={sheet === 'fuel'}
        title="Fuel"
        value={fuel}
        options={FUELS.map((f) => ({ key: f.code, label: f.label, detail: f.description, badge: f.pumpCode }))}
        onSelect={(key) => updateSettings({ fuel: key })}
        onClose={() => setSheet(null)}
        testID="fuel-sheet"
      />
      <OptionSheet
        visible={sheet === 'radius'}
        title="Search area"
        value={radiusMiles}
        options={RADIUS_OPTIONS.map((r) => ({
          key: r,
          label: `Within ${r} ${r === 1 ? 'mile' : 'miles'}`,
          detail: r <= 2 ? 'Just around here' : r <= 5 ? 'A short drive' : r <= 10 ? 'Worth a detour' : 'Wide search',
        }))}
        onSelect={(key) => updateSettings({ radiusMiles: key })}
        onClose={() => setSheet(null)}
        testID="radius-sheet"
      />
    </>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' },
});
