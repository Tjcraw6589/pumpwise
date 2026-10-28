import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Header } from '@/components/Header';
import { askForLocation } from '@/components/PhaseState';
import { Screen } from '@/components/Screen';
import { CITY_PRESETS, classifyQuery, type Place } from '@/lib/places';
import { openAppSettings } from '@/services/location';
import { searchPlaces } from '@/services/placeSearch';
import { useLive } from '@/store/useLive';
import { useStore } from '@/store/useStore';
import { useTheme } from '@/theme/useTheme';

function PlaceRow({ place, icon, onPress, testID }: { place: Place; icon: keyof typeof Ionicons.glyphMap; onPress: () => void; testID?: string }) {
  const { colors, spacing } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      testID={testID}
      style={({ pressed }) => [styles.row, { paddingVertical: spacing.md, backgroundColor: pressed ? colors.surfaceAlt : 'transparent' }]}
    >
      <Ionicons name={icon} size={20} color={colors.accentText} />
      <View style={[styles.flex, { marginLeft: spacing.md }]}>
        <AppText variant="bodyBold">{place.name}</AppText>
        {place.detail ? (
          <AppText variant="caption" tone="muted">
            {place.detail}
          </AppText>
        ) : null}
      </View>
    </Pressable>
  );
}

/** Pick where to search: the phone's location, a typed town or postcode, a recent place or a city. */
export default function PlaceScreen() {
  const router = useRouter();
  const { colors, spacing, radius } = useTheme();
  const recent = useStore((s) => s.settings.recentPlaces);
  const mode = useStore((s) => s.settings.locationMode);
  const choosePlace = useStore((s) => s.choosePlace);
  const followMyLocation = useStore((s) => s.followMyLocation);
  const permission = useLive((s) => s.permission);
  const canAskAgain = useLive((s) => s.canAskAgain);
  const [query, setQuery] = useState('');
  // Results belong to the query they were found for, so stale results never show for new text.
  const [search, setSearch] = useState<{ query: string; results: Place[]; status: 'searching' | 'done' | 'error' } | null>(null);
  const latest = useRef(0);
  const searchable = classifyQuery(query) !== null;

  useEffect(() => {
    if (!searchable) return;
    const ticket = ++latest.current;
    const text = query;
    const timer = setTimeout(() => {
      setSearch({ query: text, results: [], status: 'searching' });
      searchPlaces(text)
        .then((results) => {
          if (ticket === latest.current) setSearch({ query: text, results, status: 'done' });
        })
        .catch(() => {
          if (ticket === latest.current) setSearch({ query: text, results: [], status: 'error' });
        });
    }, 350);
    return () => clearTimeout(timer);
  }, [query, searchable]);

  const current = search && search.query === query ? search : null;
  const results = current?.results ?? [];
  const status = searchable ? (current?.status ?? 'searching') : 'idle';

  const pick = (place: Place) => {
    choosePlace(place);
    router.back();
  };

  const switchToMyLocation = async () => {
    if (permission === 'granted') {
      followMyLocation();
      router.back();
      return;
    }
    if (permission === 'denied' && !canAskAgain) {
      openAppSettings();
      return;
    }
    await askForLocation();
    if (useLive.getState().permission === 'granted') router.back();
  };

  return (
    <Screen scroll edges={['top', 'bottom']} testID="place-screen">
      <Header title="Search around" dismiss="close" />
      <View style={[styles.search, { backgroundColor: colors.input, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: spacing.md }]}>
        <Ionicons name="search" size={18} color={colors.textMuted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Town or postcode"
          placeholderTextColor={colors.textFaint}
          autoCapitalize="words"
          autoCorrect={false}
          returnKeyType="search"
          style={[styles.input, { color: colors.text, marginLeft: spacing.sm }]}
          testID="place-search"
          accessibilityLabel="Town or postcode"
        />
        {status === 'searching' ? <ActivityIndicator color={colors.textMuted} /> : null}
      </View>

      {searchable ? (
        <View style={{ marginTop: spacing.md }} testID="place-results">
          {results.map((place) => (
            <PlaceRow key={`${place.name}-${place.detail}`} place={place} icon="location-outline" onPress={() => pick(place)} testID={`place-result-${place.name}`} />
          ))}
          {status === 'done' && results.length === 0 ? (
            <AppText variant="body" tone="muted" style={{ paddingVertical: spacing.md }}>
              No UK town or postcode matches “{query.trim()}”.
            </AppText>
          ) : null}
          {status === 'error' ? (
            <AppText variant="body" tone="muted" style={{ paddingVertical: spacing.md }}>
              Search isn&apos;t answering. Check your connection, or pick a city below.
            </AppText>
          ) : null}
        </View>
      ) : null}

      <Pressable
        accessibilityRole="button"
        onPress={() => void switchToMyLocation()}
        testID="use-my-location"
        style={({ pressed }) => [
          styles.row,
          {
            marginTop: spacing.lg,
            padding: spacing.md,
            borderRadius: radius.lg,
            backgroundColor: mode === 'gps' ? colors.accentSoft : pressed ? colors.surfaceAlt : colors.surface,
            borderColor: colors.border,
            borderWidth: StyleSheet.hairlineWidth,
          },
        ]}
      >
        <Ionicons name="locate" size={20} color={colors.accentText} />
        <View style={[styles.flex, { marginLeft: spacing.md }]}>
          <AppText variant="bodyBold">Use my location</AppText>
          <AppText variant="caption" tone="muted">
            {permission === 'denied' && !canAskAgain ? 'Location is off for Pumpwise. Tap to open Settings.' : 'Follows you as you drive'}
          </AppText>
        </View>
        {mode === 'gps' ? <Ionicons name="checkmark-circle" size={22} color={colors.accentText} /> : null}
      </Pressable>

      {recent.length > 0 ? (
        <View style={{ marginTop: spacing.xl }}>
          <AppText variant="overline" tone="muted">
            Recent
          </AppText>
          {recent.map((place) => (
            <PlaceRow key={`recent-${place.name}-${place.detail}`} place={place} icon="time-outline" onPress={() => pick(place)} />
          ))}
        </View>
      ) : null}

      <View style={{ marginTop: spacing.xl }}>
        <AppText variant="overline" tone="muted">
          Cities
        </AppText>
        {CITY_PRESETS.map((place) => (
          <PlaceRow key={place.name} place={place} icon="business-outline" onPress={() => pick(place)} testID={`city-${place.name}`} />
        ))}
      </View>
      <AppText variant="caption" tone="faint" style={{ marginTop: spacing.lg }}>
        Town and postcode search uses postcodes.io, built on Ordnance Survey and ONS open data. Only what you type is sent.
      </AppText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center' },
  search: { flexDirection: 'row', alignItems: 'center', height: 50, borderWidth: 1 },
  input: { flex: 1, fontSize: 17, height: '100%' },
});
