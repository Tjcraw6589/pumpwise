import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { FreshnessTag } from '@/components/FreshnessTag';
import { PhaseState } from '@/components/PhaseState';
import { PriceSign } from '@/components/PriceSign';
import { SearchControls } from '@/components/SearchControls';
import { StationMap } from '@/components/StationMap';
import { useAreaLabel } from '@/hooks/useAreaLabel';
import { useDirections } from '@/hooks/useDirections';
import { useSearchCenter } from '@/hooks/useLiveController';
import { useNearby } from '@/hooks/useNearby';
import { useRegion } from '@/hooks/useRegion';
import { priceBands } from '@/lib/ranking';
import { fuelOption } from '@/lib/regions';
import { formatDistance, radiusLabel } from '@/lib/units';
import { useLive } from '@/store/useLive';
import { useStore } from '@/store/useStore';
import { useTheme } from '@/theme/useTheme';

export default function MapScreen() {
  const router = useRouter();
  const { colors, spacing, radius } = useTheme();
  const { phase, ranking, now } = useNearby();
  const center = useSearchCenter();
  const settings = useStore((s) => s.settings);
  const permission = useLive((s) => s.permission);
  const directions = useDirections();
  const areaLabel = useAreaLabel();
  const region = useRegion();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [recenterToken, setRecenterToken] = useState(0);

  const stations = useMemo(() => ranking?.inArea ?? [], [ranking]);
  const band = useMemo(() => priceBands(stations), [stations]);
  // With nothing tapped, the card shows the cheapest station.
  const selected = stations.find((r) => r.station.id === selectedId) ?? ranking?.cheapest ?? null;
  const isCheapest = selected?.station.id === ranking?.cheapest?.station.id;
  const showMap = (phase === 'ready' || phase === 'empty') && center;

  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]} testID="map-screen">
      {showMap ? (
        <StationMap
          center={center}
          radiusKm={settings.radiusKm}
          stations={stations}
          band={band}
          selectedId={selected?.station.id ?? null}
          onSelect={setSelectedId}
          showsUserLocation={settings.locationMode === 'gps' && permission === 'granted'}
          recenterToken={recenterToken}
        />
      ) : null}

      <SafeAreaView edges={['top', 'left', 'right']} pointerEvents="box-none" style={showMap ? styles.overlay : styles.flex}>
        <View
          style={[
            styles.topCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderRadius: radius.xl,
              marginHorizontal: spacing.md,
              marginTop: spacing.sm,
              padding: spacing.md,
            },
          ]}
        >
          <SearchControls areaLabel={areaLabel} />
        </View>
        {!showMap ? (
          <ScrollView contentContainerStyle={{ paddingHorizontal: spacing.lg }}>
            {phase !== 'ready' ? <PhaseState phase={phase} /> : null}
          </ScrollView>
        ) : null}
      </SafeAreaView>

      {showMap ? (
        <View pointerEvents="box-none" style={[styles.bottom, { padding: spacing.md }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Recentre map"
            onPress={() => setRecenterToken((t) => t + 1)}
            testID="recenter"
            style={[styles.fab, { backgroundColor: colors.surface, borderColor: colors.border, marginBottom: spacing.sm }]}
          >
            <Ionicons name="locate" size={22} color={colors.text} />
          </Pressable>
          {selected ? (
            <View
              testID="map-card"
              style={[
                styles.card,
                { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.xl, padding: spacing.lg },
              ]}
            >
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push({ pathname: '/station/[id]', params: { id: selected.station.id } })}
                style={styles.row}
              >
                <PriceSign pence={selected.price.p} size="md" tone={isCheapest ? 'cheap' : 'normal'} label={fuelOption(region, settings.fuel).pumpCode} />
                <View style={[styles.flex, { marginLeft: spacing.md }]}>
                  <AppText variant="overline" tone={isCheapest ? 'cheap' : 'muted'}>
                    {isCheapest ? `Cheapest within ${radiusLabel(settings.radiusKm, region.distanceUnit)}` : 'Selected station'}
                  </AppText>
                  <AppText variant="bodyBold" numberOfLines={1} testID="map-card-name">
                    {selected.station.name}
                  </AppText>
                  <AppText variant="caption" tone="muted" numberOfLines={1}>
                    {[formatDistance(selected.distance, region.distanceUnit), selected.open.label].filter(Boolean).join(' · ')}
                  </AppText>
                  <FreshnessTag at={selected.price.at} region={selected.station.region} now={now} />
                </View>
              </Pressable>
              <Button
                label="Directions"
                variant="accent"
                fullWidth
                onPress={() => directions(selected.station)}
                icon={<Ionicons name="navigate" size={18} color="#121B26" />}
                style={{ marginTop: spacing.md }}
                testID="map-directions"
              />
            </View>
          ) : phase === 'empty' ? (
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.xl, padding: spacing.lg }]}>
              <AppText variant="bodyBold">Nothing within {radiusLabel(settings.radiusKm, region.distanceUnit)}</AppText>
              <AppText variant="caption" tone="muted">
                Try a wider area with the chip at the top.
              </AppText>
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  overlay: { position: 'absolute', top: 0, left: 0, right: 0 },
  topCard: {
    borderWidth: StyleSheet.hairlineWidth,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  bottom: { position: 'absolute', left: 0, right: 0, bottom: 0, alignItems: 'flex-end' },
  fab: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  card: {
    alignSelf: 'stretch',
    borderWidth: StyleSheet.hairlineWidth,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
  },
  row: { flexDirection: 'row', alignItems: 'center' },
});
