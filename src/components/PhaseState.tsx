import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Animated, View } from 'react-native';

import { useCoverage, useRegion } from '@/hooks/useRegion';
import type { NearbyPhase } from '@/lib/nearby';
import type { Place } from '@/lib/places';
import { fuelOption, REGIONS, regionList } from '@/lib/regions';
import { radiusLabel, sameRadius, toKm } from '@/lib/units';
import { currentPosition, openAppSettings, requestPermission } from '@/services/location';
import { useLive } from '@/store/useLive';
import { useStore } from '@/store/useStore';
import { useTheme } from '@/theme/useTheme';

import { Button } from './Button';
import { EmptyState } from './EmptyState';

export async function askForLocation(): Promise<void> {
  const result = await requestPermission();
  useLive.getState().set({ permission: result.state, canAskAgain: result.canAskAgain });
  if (result.state === 'granted') useStore.getState().followMyLocation();
}

/** Placeholder cards while prices download. */
export function LoadingCards() {
  const { colors, spacing, radius } = useTheme();
  const [pulse] = useState(() => new Animated.Value(0.5));
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.5, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);
  const block = (height: number, key: string) => (
    <Animated.View
      key={key}
      style={{ height, borderRadius: radius.xl, backgroundColor: colors.surfaceAlt, marginBottom: spacing.md, opacity: pulse }}
    />
  );
  return (
    <View testID="loading-cards" accessibilityLabel="Loading prices">
      {block(236, 'hero')}
      {block(104, 'nearest')}
      {block(74, 'row1')}
      {block(74, 'row2')}
    </View>
  );
}

/** Everything the Nearby and Map tabs show when there is nothing to rank yet. */
export function PhaseState({ phase }: { phase: Exclude<NearbyPhase, 'ready'> }) {
  const router = useRouter();
  const canAskAgain = useLive((s) => s.canAskAgain);
  const feedError = useLive((s) => s.feedError);
  const requestRefresh = useLive((s) => s.requestRefresh);
  const fuel = useStore((s) => s.settings.fuel);
  const radiusKm = useStore((s) => s.settings.radiusKm);
  const updateSettings = useStore((s) => s.updateSettings);
  const region = useRegion();
  const coverage = useCoverage();
  const choosePlace = useStore((s) => s.choosePlace);
  const choose = () => router.push('/place');

  switch (phase) {
    case 'loading':
      return <LoadingCards />;
    case 'locating':
      return <LoadingCards />;
    case 'need-permission':
      return (
        <EmptyState
          icon="location"
          title="See prices around you"
          body="Pumpwise uses your location to find the nearest station and the cheapest one near you. Your exact location stays on your iPhone."
          testID="state-need-permission"
        >
          <Button label="Allow location" size="lg" fullWidth onPress={() => void askForLocation()} testID="allow-location" />
          <Button label="Choose a place instead" variant="secondary" size="lg" fullWidth onPress={choose} testID="choose-place" />
        </EmptyState>
      );
    case 'denied':
      return (
        <EmptyState
          icon="location-outline"
          title="Location is off"
          body={
            canAskAgain
              ? 'Pumpwise needs your location to show what is nearby. You can also search around a town or postcode.'
              : 'Turn on location for Pumpwise in Settings, or search around a town or postcode instead.'
          }
          testID="state-denied"
        >
          {canAskAgain ? (
            <Button label="Allow location" size="lg" fullWidth onPress={() => void askForLocation()} />
          ) : (
            <Button label="Open Settings" size="lg" fullWidth onPress={openAppSettings} testID="open-settings" />
          )}
          <Button label="Choose a place" variant="secondary" size="lg" fullWidth onPress={choose} testID="choose-place" />
        </EmptyState>
      );
    case 'location-error':
      return (
        <EmptyState
          icon="navigate-circle-outline"
          title="Can't find you right now"
          body="Your iPhone couldn't get a location fix. This can happen indoors or underground."
          testID="state-location-error"
        >
          <Button
            label="Try again"
            size="lg"
            fullWidth
            onPress={() => {
              useLive.getState().set({ locating: true, locationError: null });
              currentPosition()
                .then((p) => useLive.getState().set({ position: { ...p, at: Date.now() }, locating: false }))
                .catch(() => useLive.getState().set({ locating: false, locationError: 'unavailable' }));
            }}
          />
          <Button label="Choose a place" variant="secondary" size="lg" fullWidth onPress={choose} />
        </EmptyState>
      );
    case 'not-covered': {
      const firstLive = REGIONS[coverage.live[0] ?? 'wa'];
      const city = firstLive.cities[0] as Place;
      return (
        <EmptyState
          icon="earth"
          title={`Pumpwise covers ${regionList(coverage.live)}`}
          body="Prices come from official government schemes, and this place isn't covered yet. Pick somewhere that is to look around."
          testID="state-not-covered"
        >
          <Button label={`Look around ${city.name}`} size="lg" fullWidth onPress={() => choosePlace(city)} testID="try-city" />
          <Button label="Choose a place" variant="secondary" size="lg" fullWidth onPress={choose} />
        </EmptyState>
      );
    }
    case 'region-down':
      return (
        <EmptyState
          icon="time-outline"
          title="Prices are on their way"
          body={`${region.name} prices couldn't be collected just now. They usually come back within the hour.`}
          testID="state-region-down"
        >
          <Button label="Check again" size="lg" fullWidth onPress={requestRefresh} />
        </EmptyState>
      );
    case 'error':
      return (
        <EmptyState
          icon={feedError === 'offline' ? 'cloud-offline-outline' : 'alert-circle-outline'}
          title={feedError === 'offline' ? 'No connection' : "Prices didn't load"}
          body={
            feedError === 'offline'
              ? 'Pumpwise needs a data connection to fetch the latest prices.'
              : 'The price feed did not answer. It usually comes back within a few minutes.'
          }
          testID="state-error"
        >
          <Button label="Try again" size="lg" fullWidth onPress={requestRefresh} testID="retry" />
        </EmptyState>
      );
    case 'empty': {
      const unit = region.distanceUnit;
      const wider = region.radiusOptions.find((r) => toKm(r, unit) > radiusKm && !sameRadius(radiusKm, r, unit));
      const f = fuelOption(region, fuel);
      return (
        <EmptyState
          icon="search"
          title={`Nothing within ${radiusLabel(radiusKm, unit)}`}
          body={`No station in this area has a ${f.label} (${f.pumpCode}) price right now. Try a wider area or another fuel.`}
          testID="state-empty"
        >
          {wider ? (
            <Button label={`Search within ${wider} ${unit}`} size="lg" fullWidth onPress={() => updateSettings({ radiusKm: toKm(wider, unit) })} testID="widen" />
          ) : null}
        </EmptyState>
      );
    }
  }
}
