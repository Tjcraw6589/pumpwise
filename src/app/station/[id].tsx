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
import { REPORT_PRICE_URL } from '@/config/app';
import { useSearchCenter } from '@/hooks/useLiveController';
import { useNow } from '@/hooks/useNearby';
import { FUEL_CODES } from '@/lib/feed';
import { fuelInfo } from '@/lib/fuels';
import { formatMiles, formatPence } from '@/lib/format';
import { distanceMiles } from '@/lib/geo';
import { openState, ukClock, weekRows } from '@/lib/hours';
import { DIRECTIONS_APPS, openDirections } from '@/services/directions';
import { useLive } from '@/store/useLive';
import { useStore } from '@/store/useStore';
import { useTheme } from '@/theme/useTheme';

const TAG_LABELS: Record<string, { label: string; icon: keyof typeof Ionicons.glyphMap }> = {
  motorway: { label: 'Motorway services', icon: 'car-sport-outline' },
  supermarket: { label: 'Supermarket', icon: 'cart-outline' },
  toilets: { label: 'Toilets', icon: 'man-outline' },
  'car-wash': { label: 'Car wash', icon: 'water-outline' },
  '24h-fuel': { label: '24-hour pay at pump', icon: 'time-outline' },
  adblue: { label: 'AdBlue', icon: 'flask-outline' },
  lpg: { label: 'LPG', icon: 'flame-outline' },
  air: { label: 'Air and screenwash', icon: 'speedometer-outline' },
  water: { label: 'Water', icon: 'water-outline' },
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

  const open = openState(station.hours, now);
  const today = ukClock(now).day;
  const distance = center ? distanceMiles(center, station) : null;
  const fuels = FUEL_CODES.filter((code) => station.prices[code]);
  const address = [station.address, station.town, station.postcode].filter(Boolean).join(', ');

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
              {formatMiles(distance)}
            </AppText>
          </View>
        ) : null}
        {open.label ? (
          <AppText variant="bodyBold" tone={open.status === 'open' ? 'cheap' : 'pricey'}>
            {open.label}
          </AppText>
        ) : null}
      </View>

      {/* The price board: every fuel this forecourt has reported, like the sign at the roadside. */}
      <View
        testID="price-board"
        style={[styles.board, { backgroundColor: colors.sign, borderColor: colors.signBorder, borderRadius: radius.xl, padding: spacing.lg, marginTop: spacing.xl }]}
      >
        {fuels.map((code, index) => {
          const price = station.prices[code];
          if (!price) return null;
          const info = fuelInfo(code);
          const chosen = code === fuel;
          return (
            <Pressable
              key={code}
              accessibilityRole="button"
              accessibilityLabel={`${info.label}, ${formatPence(price.p)} pence`}
              onPress={() => updateSettings({ fuel: code })}
              style={[
                styles.boardRow,
                { paddingVertical: spacing.sm, borderTopColor: colors.signBorder, borderTopWidth: index === 0 ? 0 : StyleSheet.hairlineWidth },
              ]}
            >
              <View style={styles.flex}>
                <AppText variant="bodyBold" style={{ color: chosen ? colors.signDigits : '#E9EDF2' }}>
                  {info.label}
                </AppText>
                <AppText variant="caption" style={{ color: colors.signLabel }}>
                  {info.pumpCode} · {info.description}
                </AppText>
              </View>
              <AppText variant="priceXL" style={{ color: chosen ? colors.signCheap : colors.signDigits, fontSize: 40, lineHeight: 44 }}>
                {formatPence(price.p)}
              </AppText>
            </Pressable>
          );
        })}
      </View>
      {station.prices[fuel] ? (
        <View style={{ marginTop: spacing.sm }}>
          <FreshnessTag at={station.prices[fuel].at} now={now} testID="station-freshness" />
        </View>
      ) : (
        <AppText variant="caption" tone="muted" style={{ marginTop: spacing.sm }}>
          No {fuelInfo(fuel).label.toLowerCase()} price reported here.
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

      {station.tags.length > 0 ? (
        <View style={{ marginTop: spacing.xl }}>
          <AppText variant="overline" tone="muted" style={{ marginBottom: spacing.sm }}>
            At this station
          </AppText>
          <View style={[styles.tags, { gap: spacing.sm }]}>
            {station.tags.map((tag) => {
              const known = TAG_LABELS[tag];
              if (!known) return null;
              return (
                <View key={tag} style={[styles.tag, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.pill }]}>
                  <Ionicons name={known.icon} size={14} color={colors.accentText} />
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
        onPress={() => void Linking.openURL(REPORT_PRICE_URL)}
        style={[styles.report, { borderColor: colors.border, borderRadius: radius.lg, padding: spacing.md, marginTop: spacing.xl }]}
        testID="station-report"
      >
        <Ionicons name="flag-outline" size={18} color={colors.accentText} />
        <View style={[styles.flex, { marginLeft: spacing.sm }]}>
          <AppText variant="bodyBold">Price wrong at the pump?</AppText>
          <AppText variant="caption" tone="muted">
            Report it to GOV.UK. Forecourts must update prices within 30 minutes of a change.
          </AppText>
        </View>
        <Ionicons name="open-outline" size={16} color={colors.textFaint} />
      </Pressable>
      <AppText variant="caption" tone="faint" style={{ marginTop: spacing.lg, marginBottom: spacing.xl }}>
        Prices and details from the UK Government Fuel Finder scheme. Contains public sector information licensed under the Open
        Government Licence v3.0.
      </AppText>
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
