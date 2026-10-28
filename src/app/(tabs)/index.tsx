import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { FlatList, Linking, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/components/AppText';
import { CheapestCard, NearestCard } from '@/components/HeroCards';
import { Notice } from '@/components/Notice';
import { PhaseState } from '@/components/PhaseState';
import { PriceSign } from '@/components/PriceSign';
import { PumpMark } from '@/components/PumpMark';
import { SearchControls } from '@/components/SearchControls';
import { SegmentedControl } from '@/components/SegmentedControl';
import { StationRow } from '@/components/StationRow';
import { REPORT_PRICE_URL } from '@/config/app';
import { useAreaLabel } from '@/hooks/useAreaLabel';
import { useDirections } from '@/hooks/useDirections';
import { useNearby } from '@/hooks/useNearby';
import { formatMiles, formatPounds, timeAgo } from '@/lib/format';
import { priceBands, type RankedStation, type SortMode, sortStations } from '@/lib/ranking';
import { useLive } from '@/store/useLive';
import { useStore } from '@/store/useStore';
import { useTheme } from '@/theme/useTheme';

const SORTS: readonly { key: SortMode; label: string }[] = [
  { key: 'price', label: 'Cheapest' },
  { key: 'distance', label: 'Closest' },
  { key: 'value', label: 'Best value' },
];

function BestValueRow({ item, onPress }: { item: RankedStation; onPress: () => void }) {
  const { colors, spacing, radius } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      testID="best-value-row"
      style={({ pressed }) => [
        styles.bestValue,
        {
          backgroundColor: pressed ? colors.surfaceAlt : colors.surface,
          borderColor: colors.border,
          borderRadius: radius.xl,
          padding: spacing.lg,
          marginTop: spacing.md,
        },
      ]}
    >
      <View style={styles.flex}>
        <AppText variant="overline" tone="cheap">
          Best value once you count the drive
        </AppText>
        <AppText variant="bodyBold" numberOfLines={1} style={{ marginTop: spacing.xs }}>
          {item.station.name}
        </AppText>
        <AppText variant="caption" tone="muted">
          {formatMiles(item.distance)} · {formatPounds(item.realCost)} with the fuel to get there and back
        </AppText>
      </View>
      <PriceSign pence={item.price.p} size="sm" />
    </Pressable>
  );
}

export default function NearbyScreen() {
  const router = useRouter();
  const { colors, spacing } = useTheme();
  const { phase, ranking, now } = useNearby();
  const settings = useStore((s) => s.settings);
  const updateSettings = useStore((s) => s.updateSettings);
  const meta = useLive((s) => s.meta);
  const loadedAt = useLive((s) => s.loadedAt);
  const feedError = useLive((s) => s.feedError);
  const refreshing = useLive((s) => s.refreshing);
  const requestRefresh = useLive((s) => s.requestRefresh);
  const directions = useDirections();
  const areaLabel = useAreaLabel();

  const list = useMemo(() => (ranking ? sortStations(ranking.inArea, settings.sortBy) : []), [ranking, settings.sortBy]);
  const band = useMemo(() => priceBands(ranking?.inArea ?? []), [ranking]);
  const openStation = (id: string) => router.push({ pathname: '/station/[id]', params: { id } });

  const feedAgeHours = meta ? (now.getTime() - Date.parse(meta.generatedAt)) / 3_600_000 : 0;
  const cheapest = ranking?.cheapest ?? null;
  const nearest = ranking?.nearest ?? null;
  const bestValue = ranking?.bestValue ?? null;

  const header = (
    <View>
      <View style={[styles.brandRow, { marginTop: spacing.sm }]}>
        <PumpMark size={30} />
        <AppText variant="title" style={[styles.flex, { marginLeft: spacing.sm }]}>
          Pumpwise
        </AppText>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Refresh prices"
          onPress={requestRefresh}
          hitSlop={10}
          testID="refresh"
          style={[styles.iconButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <Ionicons name="refresh" size={20} color={colors.text} />
        </Pressable>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Searching ${areaLabel}. Change place`}
        onPress={() => router.push('/place')}
        hitSlop={6}
        testID="place-chip"
        style={[styles.placeRow, { marginTop: 2, marginBottom: spacing.md }]}
      >
        <Ionicons name={settings.locationMode === 'gps' ? 'navigate' : 'map'} size={14} color={colors.accentText} />
        <AppText variant="bodyBold" numberOfLines={1} style={{ marginLeft: 6, flexShrink: 1 }}>
          {areaLabel}
        </AppText>
        <Ionicons name="chevron-down" size={14} color={colors.textMuted} style={{ marginLeft: 2 }} />
        {loadedAt && meta?.status === 'live' && phase === 'ready' ? (
          <AppText variant="caption" tone="muted" numberOfLines={1} style={{ marginLeft: 6 }} testID="checked-line">
            · checked {timeAgo(new Date(loadedAt).toISOString(), now)}
          </AppText>
        ) : null}
      </Pressable>
      <SearchControls areaLabel={areaLabel} showPlace={false} />
      <View style={{ height: spacing.md }} />

      {feedError && phase === 'ready' && loadedAt ? (
        <Notice
          tone="warning"
          text={`Couldn't update. Showing prices from ${timeAgo(new Date(loadedAt).toISOString(), now)}.`}
          action={{ label: 'Retry', onPress: requestRefresh }}
          testID="stale-notice"
        />
      ) : null}
      {phase === 'ready' && feedAgeHours > 2 ? (
        <Notice
          tone="warning"
          icon="time-outline"
          text={`The price feed last updated ${timeAgo(meta?.generatedAt ?? '', now)}. Prices may have changed since.`}
        />
      ) : null}

      {phase !== 'ready' ? (
        <PhaseState phase={phase} />
      ) : (
        <View>
          {cheapest ? (
            <CheapestCard
              item={cheapest}
              radiusMiles={settings.radiusMiles}
              fuel={settings.fuel}
              fillLitres={settings.fillLitres}
              savings={ranking?.savings ?? null}
              alsoNearest={nearest?.station.id === cheapest.station.id}
              now={now}
              onDirections={() => directions(cheapest.station)}
              onDetails={() => openStation(cheapest.station.id)}
            />
          ) : (
            <Notice icon="moon-outline" text={`Every station within ${settings.radiusMiles} mi is closed right now or hasn't confirmed its price lately.`} />
          )}
          {nearest && nearest.station.id !== cheapest?.station.id ? (
            <NearestCard
              item={nearest}
              fuel={settings.fuel}
              now={now}
              insideArea={nearest.distance <= settings.radiusMiles}
              onDirections={() => directions(nearest.station)}
              onDetails={() => openStation(nearest.station.id)}
            />
          ) : null}
          {bestValue && bestValue.station.id !== cheapest?.station.id && bestValue.station.id !== nearest?.station.id ? (
            <BestValueRow item={bestValue} onPress={() => openStation(bestValue.station.id)} />
          ) : null}

          <View style={[styles.listHeader, { marginTop: spacing.xl, marginBottom: spacing.sm }]}>
            <AppText variant="h2" style={styles.flex}>
              All nearby
            </AppText>
            <AppText variant="caption" tone="muted" testID="station-count">
              {list.length} {list.length === 1 ? 'station' : 'stations'} · {settings.radiusMiles} mi
            </AppText>
          </View>
          <SegmentedControl options={SORTS} value={settings.sortBy} onChange={(sortBy) => updateSettings({ sortBy })} testID="sort" />
          <View style={{ height: spacing.md }} />
        </View>
      )}
    </View>
  );

  const footer =
    phase === 'ready' ? (
      <View style={{ paddingTop: spacing.md, paddingBottom: spacing.xxl }}>
        <AppText variant="caption" tone="faint" align="center">
          Prices from the UK Government Fuel Finder scheme. Distances are as the crow flies.
        </AppText>
        <Pressable accessibilityRole="link" onPress={() => void Linking.openURL(REPORT_PRICE_URL)} hitSlop={8} testID="report-link">
          <AppText variant="small" tone="accent" align="center" style={{ marginTop: spacing.sm }}>
            Price wrong at the pump? Report it to GOV.UK
          </AppText>
        </Pressable>
      </View>
    ) : undefined;

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.flex, { backgroundColor: colors.background }]} testID="nearby-screen">
      <FlatList
        data={phase === 'ready' ? list : []}
        keyExtractor={(item) => item.station.id}
        renderItem={({ item }) => (
          <StationRow item={item} band={band(item.price.p)} sortBy={settings.sortBy} now={now} onPress={() => openStation(item.station.id)} />
        )}
        ListHeaderComponent={header}
        ListFooterComponent={footer}
        contentContainerStyle={{ paddingHorizontal: spacing.lg }}
        showsVerticalScrollIndicator={false}
        initialNumToRender={12}
        refreshControl={<RefreshControl refreshing={refreshing && phase === 'ready'} onRefresh={requestRefresh} tintColor={colors.accent} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  brandRow: { flexDirection: 'row', alignItems: 'center' },
  iconButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderWidth: StyleSheet.hairlineWidth },
  listHeader: { flexDirection: 'row', alignItems: 'baseline' },
  bestValue: { flexDirection: 'row', alignItems: 'center', borderWidth: StyleSheet.hairlineWidth, gap: 12 },
  placeRow: { flexDirection: 'row', alignItems: 'center' },
});
