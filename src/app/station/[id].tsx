import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { Linking, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { FreshnessTag } from '@/components/FreshnessTag';
import { Header } from '@/components/Header';
import { Screen } from '@/components/Screen';
import { SegmentedControl } from '@/components/SegmentedControl';
import { useSearchCenter } from '@/hooks/useLiveController';
import { useNow } from '@/hooks/useNearby';
import { formatChange, formatPrice } from '@/lib/format';
import { distanceKm } from '@/lib/geo';
import { localClock, openState, weekRows } from '@/lib/hours';
import { fuelOption, REGIONS } from '@/lib/regions';
import { formatDistance } from '@/lib/units';
import { DIRECTIONS_APPS, openDirections } from '@/services/directions';
import { useLive } from '@/store/useLive';
import { useStore } from '@/store/useStore';
import { useTheme } from '@/theme/useTheme';

const TAG_LABELS: Record<string, { label: string; icon: keyof typeof Ionicons.glyphMap; warn?: boolean }> = {
  'members-only': { label: 'Members only', icon: 'card-outline', warn: true },
  'permit-required': { label: 'Entry permit needed', icon: 'document-lock-outline', warn: true },
  unmanned: { label: 'Unmanned, card only', icon: 'card-outline' },
  'low-aromatic': { label: 'Low aromatic fuel', icon: 'leaf-outline' },
  motorway: { label: 'Motorway services', icon: 'car-sport-outline' },
  supermarket: { label: 'Supermarket', icon: 'cart-outline' },
  toilets: { label: 'Toilets', icon: 'man-outline' },
  'car-wash': { label: 'Car wash', icon: 'water-outline' },
  '24h-fuel': { label: '24-hour pay at pump', icon: 'time-outline' },
  adblue: { label: 'AdBlue', icon: 'flask-outline' },
  lpg: { label: 'LPG', icon: 'flame-outline' },
  air: { label: 'Air', icon: 'speedometer-outline' },
  water: { label: 'Water', icon: 'water-outline' },
  atm: { label: 'ATM', icon: 'cash-outline' },
  truck: { label: 'Truck friendly', icon: 'bus-outline' },
};

export default function StationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, spacing, radius } = useTheme();
  const now = useNow();
  const station = useLive((s) => s.stations.find((st) => st.id === id));
  const center = useSearchCenter();
  const fuel = useStore((s) => s.settings.fuel);
  const directionsApp = useStore((s) => s.settings.directionsApp);
  const updateSettings = useStore((s) => s.updateSettings);

  if (!station) {
    return (
      <Screen edges={['top', 'bottom']} testID="station-screen">
        <Header title="Station" dismiss="close" />
        <EmptyState icon="help-circle-outline" title="Station not found" body="Prices may have refreshed. Go back and pick it again." />
      </Screen>
    );
  }

  const region = REGIONS[station.region];
  const offset = region.utcOffsetMinutes(now);
  const open = openState(station.hours, now, offset);
  const today = localClock(now, offset).day;
  const distance = center ? distanceKm(center, station) : null;
  const fuels = region.fuels.filter((f) => station.prices[f.kind]);
  const chosen = fuelOption(region, fuel).kind;
  const hasTomorrow = fuels.some((f) => station.tomorrow?.[f.kind] !== undefined);
  const address = [station.address, station.town, station.postcode].filter(Boolean).join(', ');
  const chosenPrice = station.prices[chosen];

  return (
    <Screen scroll edges={['top', 'bottom']} testID="station-screen">
      <Header title="" dismiss="close" />
      <AppText variant="title" testID="station-name">
        {station.name}
      </AppText>
      {station.brand && station.brand !== station.name ? (
        <AppText variant="bodyBold" tone="accent">
          {station.brand}
        </AppText>
      ) : null}
      <AppText variant="body" tone="muted" style={{ marginTop: spacing.xs }}>
        {address}
      </AppText>
      <View style={[styles.metaRow, { marginTop: spacing.sm, gap: spacing.md }]}>
        {distance !== null ? (
          <View style={styles.inline}>
            <Ionicons name="navigate" size={14} color={colors.accentText} />
            <AppText variant="bodyBold" style={{ marginLeft: 4 }}>
              {formatDistance(distance, region.distanceUnit)}
            </AppText>
          </View>
        ) : null}
        {open.label ? (
          <AppText variant="bodyBold" tone={open.status === 'open' ? 'cheap' : 'pricey'}>
            {open.label}
          </AppText>
        ) : null}
      </View>

      {/* The price board: every fuel this station sells, like the sign at the roadside. */}
      <View
        testID="price-board"
        style={[styles.board, { backgroundColor: colors.sign, borderColor: colors.signBorder, borderRadius: radius.xl, padding: spacing.lg, marginTop: spacing.xl }]}
      >
        {hasTomorrow ? (
          <View style={[styles.boardRow, { paddingBottom: spacing.xs }]}>
            <View style={styles.flex} />
            <AppText variant="overline" style={{ color: colors.signLabel, width: 92, textAlign: 'right' }}>
              Today
            </AppText>
            <AppText variant="overline" style={{ color: colors.signLabel, width: 78, textAlign: 'right' }}>
              Tomorrow
            </AppText>
          </View>
        ) : null}
        {fuels.map((f, index) => {
          const price = station.prices[f.kind];
          if (!price) return null;
          const isChosen = f.kind === chosen;
          const next = station.tomorrow?.[f.kind];
          return (
            <Pressable
              key={f.kind}
              accessibilityRole="button"
              accessibilityLabel={`${f.label}, ${formatPrice(price.p)}`}
              onPress={() => updateSettings({ fuel: f.kind })}
              style={[
                styles.boardRow,
                { paddingVertical: spacing.sm, borderTopColor: colors.signBorder, borderTopWidth: index === 0 ? 0 : StyleSheet.hairlineWidth },
              ]}
            >
              <View style={styles.flex}>
                <AppText variant="bodyBold" style={{ color: isChosen ? colors.signDigits : '#E9EDF2' }}>
                  {f.label}
                </AppText>
                <AppText variant="caption" style={{ color: colors.signLabel }}>
                  {f.pumpCode} · {f.description}
                </AppText>
              </View>
              <AppText variant="priceXL" style={{ color: isChosen ? colors.signCheap : colors.signDigits, fontSize: 38, lineHeight: 42, width: 92, textAlign: 'right' }}>
                {formatPrice(price.p)}
              </AppText>
              {hasTomorrow ? (
                <View style={{ width: 78, alignItems: 'flex-end' }}>
                  {next !== undefined ? (
                    <>
                      <AppText variant="stat" style={{ color: '#E9EDF2' }}>
                        {formatPrice(next)}
                      </AppText>
                      <AppText variant="small" style={{ color: next < price.p ? colors.signCheap : next > price.p ? '#FF8A80' : colors.signLabel }}>
                        {formatChange(next - price.p)}
                      </AppText>
                    </>
                  ) : (
                    <AppText variant="caption" style={{ color: colors.signLabel }}>
                      –
                    </AppText>
                  )}
                </View>
              ) : null}
            </Pressable>
          );
        })}
      </View>
      {chosenPrice ? (
        <View style={{ marginTop: spacing.sm }}>
          <FreshnessTag at={chosenPrice.at} region={station.region} now={now} testID="station-freshness" />
        </View>
      ) : (
        <AppText variant="caption" tone="muted" style={{ marginTop: spacing.sm }}>
          No {fuelOption(region, chosen).label} price at this station.
        </AppText>
      )}

      <View style={{ marginTop: spacing.xl }}>
        <Button
          label="Directions"
          variant="accent"
          size="lg"
          fullWidth
          onPress={() => void openDirections(directionsApp, station, station.name)}
          icon={<Ionicons name="navigate" size={18} color="#121B26" />}
          testID="station-directions"
        />
        <View style={{ marginTop: spacing.sm }}>
          <SegmentedControl options={DIRECTIONS_APPS} value={directionsApp} onChange={(key) => updateSettings({ directionsApp: key })} testID="directions-app" />
        </View>
      </View>

      {station.hours ? (
        <View style={{ marginTop: spacing.xl }}>
          <AppText variant="overline" tone="muted" style={{ marginBottom: spacing.sm }}>
            Opening hours
          </AppText>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.lg, padding: spacing.md }]}>
            {weekRows(station.hours).map((row, i) => (
              <View key={row.day} style={[styles.hoursRow, { paddingVertical: 6 }]}>
                <AppText variant={i === today ? 'bodyBold' : 'body'} style={styles.flex}>
                  {row.day}
                </AppText>
                <AppText variant={i === today ? 'bodyBold' : 'body'} tone={i === today ? 'text' : 'muted'}>
                  {row.text}
                </AppText>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      {station.tags.some((t) => TAG_LABELS[t]) ? (
        <View style={{ marginTop: spacing.xl }}>
          <AppText variant="overline" tone="muted" style={{ marginBottom: spacing.sm }}>
            At this station
          </AppText>
          <View style={[styles.tags, { gap: spacing.sm }]}>
            {station.tags.map((tag) => {
              const known = TAG_LABELS[tag];
              if (!known) return null;
              return (
                <View
                  key={tag}
                  testID={`tag-${tag}`}
                  style={[
                    styles.tag,
                    {
                      backgroundColor: known.warn ? colors.warningSoft : colors.surface,
                      borderColor: known.warn ? colors.warningSoft : colors.border,
                      borderRadius: radius.pill,
                    },
                  ]}
                >
                  <Ionicons name={known.icon} size={14} color={known.warn ? colors.warning : colors.accentText} />
                  <AppText variant="small" style={{ marginLeft: 6 }}>
                    {known.label}
                  </AppText>
                </View>
              );
            })}
          </View>
        </View>
      ) : null}

      <Pressable
        accessibilityRole="link"
        onPress={() => void Linking.openURL(region.report.url)}
        style={[styles.report, { borderColor: colors.border, borderRadius: radius.lg, padding: spacing.md, marginTop: spacing.xl }]}
        testID="station-report"
      >
        <Ionicons name="flag-outline" size={18} color={colors.accentText} />
        <View style={[styles.flex, { marginLeft: spacing.sm }]}>
          <AppText variant="bodyBold">Price wrong at the pump?</AppText>
          <AppText variant="caption" tone="muted">
            {region.report.label}. {region.report.note}
          </AppText>
        </View>
        <Ionicons name="open-outline" size={16} color={colors.textFaint} />
      </Pressable>
      <Pressable accessibilityRole="link" onPress={() => void Linking.openURL(region.source.url)} style={{ marginTop: spacing.lg, marginBottom: spacing.xl }} testID="station-source">
        <AppText variant="caption" tone="faint">
          {region.source.credit}:{' '}
          <AppText variant="caption" tone="accent">
            {region.source.url.replace(/^https:\/\//, '')}
          </AppText>
        </AppText>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  metaRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  inline: { flexDirection: 'row', alignItems: 'center' },
  board: { borderWidth: 1 },
  boardRow: { flexDirection: 'row', alignItems: 'center' },
  card: { borderWidth: StyleSheet.hairlineWidth },
  hoursRow: { flexDirection: 'row' },
  tags: { flexDirection: 'row', flexWrap: 'wrap' },
  tag: { flexDirection: 'row', alignItems: 'center', borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 12, paddingVertical: 7 },
  report: { flexDirection: 'row', alignItems: 'center', borderWidth: 1 },
});
