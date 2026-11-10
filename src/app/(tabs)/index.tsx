import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useMemo } from 'react';
import { FlatList, Linking, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AdBanner } from '@/components/AdBanner';
import { AppText } from '@/components/AppText';
import { CheapestCard, NearestCard } from '@/components/HeroCards';
import { Notice } from '@/components/Notice';
import { PhaseState } from '@/components/PhaseState';
import { PriceSign } from '@/components/PriceSign';
import { PumpMark } from '@/components/PumpMark';
import { SearchControls } from '@/components/SearchControls';
import { SegmentedControl } from '@/components/SegmentedControl';
import { StationRow } from '@/components/StationRow';
import { useAreaLabel } from '@/hooks/useAreaLabel';
import { useDirections } from '@/hooks/useDirections';
import { useNearby } from '@/hooks/useNearby';
import { useRegion } from '@/hooks/useRegion';
import { localNumber, type PlainKey, t } from '@/i18n';
import { formatChange, formatMoney, spokenPrice, timeAgo } from '@/lib/format';
import { feedWarning } from '@/lib/nearby';
import { priceBands, type RankedStation, type SortMode, sortStations, type Trend } from '@/lib/ranking';
import { fuelOption, REGIONS, type RegionInfo } from '@/lib/regions';
import { formatDistance, radiusLabel } from '@/lib/units';
import { initializeAds } from '@/services/ads';
import { useLive } from '@/store/useLive';
import { useStore } from '@/store/useStore';
import { useTheme } from '@/theme/useTheme';

const SORTS: readonly { key: SortMode; label: PlainKey }[] = [
  { key: 'price', label: 'sort.cheapest' },
  { key: 'distance', label: 'sort.closest' },
  { key: 'value', label: 'sort.value' },
];

function TrendNotice({ trend, region, fuelLabel }: { trend: Trend; region: RegionInfo; fuelLabel: string }) {
  const unit = region.priceUnit;
  const rises = trend.change > 0.5;
  const drops = trend.change < -0.5;
  const amount = `${localNumber(formatChange(trend.change).slice(1))}${unit}`;
  const text = drops ? t('trend.drops', fuelLabel, amount) : rises ? t('trend.rises', fuelLabel, amount) : t('trend.same', fuelLabel);
  return <Notice tone={rises ? 'warning' : drops ? 'good' : 'info'} icon={drops ? 'trending-down' : rises ? 'trending-up' : 'calendar-outline'} text={text} testID="trend-notice" />;
}

function BestValueRow({ item, onPress }: { item: RankedStation; onPress: () => void }) {
  const { colors, spacing, radius } = useTheme();
  const region = REGIONS[item.station.region];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${t('value.title')}: ${item.station.name}, ${spokenPrice(item.price.p, region)}, ${formatDistance(item.distance, region.distanceUnit)}, ${t('value.withDrive', formatMoney(item.realCost, region))}`}
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
          {t('value.title')}
        </AppText>
        <AppText variant="bodyBold" numberOfLines={1} style={{ marginTop: spacing.xs }}>
          {item.station.name}
        </AppText>
        <AppText variant="caption" tone="muted">
          {formatDistance(item.distance, region.distanceUnit)} · {t('value.withDrive', formatMoney(item.realCost, region))}
        </AppText>
      </View>
      <PriceSign pence={item.price.p} region={region} size="sm" />
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
  const region = useRegion();
  const fuel = fuelOption(region, settings.fuel);

  // Ads, and the consent or tracking prompts before them, start once the first prices are on screen,
  // so a new user isn't asked to allow tracking straight after allowing location.
  useEffect(() => {
    if (phase === 'ready') void initializeAds();
  }, [phase]);

  const list = useMemo(() => (ranking ? sortStations(ranking.inArea, settings.sortBy) : []), [ranking, settings.sortBy]);
  const band = useMemo(() => priceBands(ranking?.inArea ?? []), [ranking]);
  const openStation = (id: string) => router.push({ pathname: '/station/[id]', params: { id } });

  const latestPriceAt = ranking?.inArea.reduce<string | null>((best, r) => (best === null || r.price.at > best ? r.price.at : best), null) ?? null;
  // Each region refreshes on its own schedule, so judge it by its own last update.
  const regionUpdatedAt = meta?.regions[region.id]?.updatedAt ?? meta?.generatedAt;
  const staleWarning = meta && regionUpdatedAt ? feedWarning(regionUpdatedAt, region, now, latestPriceAt) : null;
  const cheapest = ranking?.cheapest ?? null;
  const nearest = ranking?.nearest ?? null;
  const bestValue = ranking?.bestValue ?? null;
  const showBestValue = !!bestValue && bestValue.station.id !== cheapest?.station.id && bestValue.station.id !== nearest?.station.id;
  const betterPick = showBestValue && !!nearest && !!bestValue && bestValue.realCost < nearest.realCost - 0.005;
  // Worth a mention only when it is at least 30c better, all in.
  const betterStill =
    showBestValue && bestValue && cheapest && cheapest.realCost - bestValue.realCost >= 0.3
      ? { name: bestValue.station.name, amount: cheapest.realCost - bestValue.realCost }
      : null;

  const header = (
    <View>
      <View style={[styles.brandRow, { marginTop: spacing.sm }]}>
        <PumpMark size={30} />
        <AppText variant="title" style={[styles.flex, { marginLeft: spacing.sm }]}>
          Pumpwise
        </AppText>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('nearby.refresh')}
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
        accessibilityLabel={t('nearby.searching', areaLabel)}
        onPress={() => router.push('/place')}
        hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}
        testID="place-chip"
        style={[styles.placeRow, { marginTop: 2, marginBottom: spacing.md }]}
      >
        <Ionicons name={settings.locationMode === 'gps' ? 'navigate' : 'map'} size={14} color={colors.accentText} />
        <AppText variant="bodyBold" numberOfLines={1} style={{ marginLeft: 6, flexShrink: 1 }}>
          {areaLabel}
        </AppText>
        <Ionicons name="chevron-down" size={14} color={colors.textMuted} style={{ marginLeft: 2 }} />
        {loadedAt && meta && phase === 'ready' ? (
          <AppText variant="caption" tone="muted" numberOfLines={1} style={{ marginLeft: 6 }} testID="checked-line">
            {t('nearby.checked', timeAgo(new Date(loadedAt).toISOString(), now))}
          </AppText>
        ) : null}
      </Pressable>
      {phase === 'not-covered' ? null : <SearchControls areaLabel={areaLabel} showPlace={false} />}
      <View style={{ height: spacing.md }} />

      {feedError && phase === 'ready' && loadedAt ? (
        <Notice
          tone="warning"
          text={t('nearby.couldntUpdate', timeAgo(new Date(loadedAt).toISOString(), now))}
          action={{ label: t('action.retry'), onPress: requestRefresh }}
          testID="stale-notice"
        />
      ) : null}
      {phase === 'ready' && ranking?.trend ? <TrendNotice trend={ranking.trend} region={region} fuelLabel={fuel.label} /> : null}
      {phase === 'ready' && staleWarning ? <Notice tone="warning" icon="time-outline" text={staleWarning} testID="feed-warning" /> : null}

      {phase !== 'ready' ? (
        <PhaseState phase={phase} />
      ) : (
        <View>
          {cheapest ? (
            <CheapestCard
              item={cheapest}
              radiusKm={settings.radiusKm}
              fuel={fuel.kind}
              fillLitres={settings.fillLitres}
              savings={ranking?.savings ?? null}
              alsoNearest={nearest?.station.id === cheapest.station.id}
              betterPick={betterPick}
              betterStill={betterStill}
              now={now}
              onDirections={() => directions(cheapest.station)}
              onDetails={() => openStation(cheapest.station.id)}
            />
          ) : (
            <Notice
              icon="moon-outline"
              text={t('nearby.allClosed', radiusLabel(settings.radiusKm, region.distanceUnit))}
            />
          )}
          {nearest && nearest.station.id !== cheapest?.station.id ? (
            <NearestCard
              item={nearest}
              fuel={fuel.kind}
              now={now}
              insideArea={nearest.distance <= settings.radiusKm}
              onDirections={() => directions(nearest.station)}
              onDetails={() => openStation(nearest.station.id)}
            />
          ) : null}
          {showBestValue && bestValue ? (
            <BestValueRow item={bestValue} onPress={() => openStation(bestValue.station.id)} />
          ) : null}

          <View style={[styles.listHeader, { marginTop: spacing.xl, marginBottom: spacing.sm }]}>
            <AppText variant="h2" style={styles.flex}>
              {t('nearby.allNearby')}
            </AppText>
            <AppText variant="caption" tone="muted" testID="station-count">
              {t('nearby.stations', list.length)} · {radiusLabel(settings.radiusKm, region.distanceUnit)}
            </AppText>
          </View>
          <SegmentedControl options={SORTS.map((s) => ({ key: s.key, label: t(s.label) }))} value={settings.sortBy} onChange={(sortBy) => updateSettings({ sortBy })} testID="sort" />
          <View style={{ height: spacing.md }} />
        </View>
      )}
    </View>
  );

  const footer =
    phase === 'ready' ? (
      <View style={{ paddingTop: spacing.md, paddingBottom: spacing.xxl }}>
        <Pressable accessibilityRole="link" onPress={() => void Linking.openURL(region.source.url)} hitSlop={8} testID="source-link">
          <AppText variant="caption" tone="faint" align="center">
            {region.source.credit}.
          </AppText>
          <AppText variant="small" tone="accent" align="center" style={{ marginTop: 2 }}>
            {region.source.url.replace(/^https:\/\//, '')}
          </AppText>
        </Pressable>
        <AppText variant="caption" tone="faint" align="center" style={{ marginTop: spacing.sm }}>
          {t('nearby.straightLine')}
        </AppText>
        <Pressable accessibilityRole="link" onPress={() => void Linking.openURL(region.report.url)} hitSlop={8} testID="report-link">
          <AppText variant="small" tone="accent" align="center" style={{ marginTop: spacing.sm }}>
            {t('report.priceWrong')} {region.report.label}
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
      <AdBanner />
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
