import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Animated, View } from 'react-native';

import { useCoverage, useRegion } from '@/hooks/useRegion';
import { t } from '@/i18n';
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
    <View testID="loading-cards" accessibilityLabel={t('state.loading')}>
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
          title={t('state.permissionTitle')}
          body={t('state.permissionBody')}
          testID="state-need-permission"
        >
          <Button label={t('action.allowLocation')} size="lg" fullWidth onPress={() => void askForLocation()} testID="allow-location" />
          <Button label={t('state.choosePlaceInstead')} variant="secondary" size="lg" fullWidth onPress={choose} testID="choose-place" />
        </EmptyState>
      );
    case 'denied':
      return (
        <EmptyState
          icon="location-outline"
          title={t('state.deniedTitle')}
          body={
            canAskAgain
              ? t('state.deniedBodyAsk')
              : t('state.deniedBodySettings')
          }
          testID="state-denied"
        >
          {canAskAgain ? (
            <Button label={t('action.allowLocation')} size="lg" fullWidth onPress={() => void askForLocation()} />
          ) : (
            <Button label={t('state.openSettings')} size="lg" fullWidth onPress={openAppSettings} testID="open-settings" />
          )}
          <Button label={t('action.choosePlace')} variant="secondary" size="lg" fullWidth onPress={choose} testID="choose-place" />
        </EmptyState>
      );
    case 'location-error':
      return (
        <EmptyState
          icon="navigate-circle-outline"
          title={t('state.locationErrorTitle')}
          body={t('state.locationErrorBody')}
          testID="state-location-error"
        >
          <Button
            label={t('action.tryAgain')}
            size="lg"
            fullWidth
            onPress={() => {
              useLive.getState().set({ locating: true, locationError: null });
              currentPosition()
                .then((p) => useLive.getState().set({ position: { ...p, at: Date.now() }, locating: false }))
                .catch(() => useLive.getState().set({ locating: false, locationError: 'unavailable' }));
            }}
          />
          <Button label={t('action.choosePlace')} variant="secondary" size="lg" fullWidth onPress={choose} />
        </EmptyState>
      );
    case 'not-covered': {
      const firstLive = REGIONS[coverage.live[0] ?? 'wa'];
      const city = firstLive.cities[0] as Place;
      return (
        <EmptyState
          icon="earth"
          title={t('state.notCoveredTitle', regionList(coverage.live))}
          body={t('state.notCoveredBody')}
          testID="state-not-covered"
        >
          <Button label={t('state.lookAround', city.name)} size="lg" fullWidth onPress={() => choosePlace(city)} testID="try-city" />
          <Button label={t('action.choosePlace')} variant="secondary" size="lg" fullWidth onPress={choose} />
        </EmptyState>
      );
    }
    case 'region-down':
      return (
        <EmptyState
          icon="time-outline"
          title={t('state.regionDownTitle')}
          body={t('state.regionDownBody', region.name)}
          testID="state-region-down"
        >
          <Button label={t('state.checkAgain')} size="lg" fullWidth onPress={requestRefresh} />
        </EmptyState>
      );
    case 'error':
      return (
        <EmptyState
          icon={feedError === 'offline' ? 'cloud-offline-outline' : 'alert-circle-outline'}
          title={feedError === 'offline' ? t('state.offlineTitle') : t('state.errorTitle')}
          body={feedError === 'offline' ? t('state.offlineBody') : t('state.errorBody')}
          testID="state-error"
        >
          <Button label={t('action.tryAgain')} size="lg" fullWidth onPress={requestRefresh} testID="retry" />
        </EmptyState>
      );
    case 'empty': {
      const unit = region.distanceUnit;
      // Jump to at least double the area, so a remote driver isn't stepping 8, 10, 15, 25 km one tap at a time.
      const bigger = region.radiusOptions.filter((r) => toKm(r, unit) > radiusKm && !sameRadius(radiusKm, r, unit));
      const wider = bigger.find((r) => toKm(r, unit) >= 2 * radiusKm) ?? bigger[bigger.length - 1];
      const f = fuelOption(region, fuel);
      return (
        <EmptyState
          icon="search"
          title={t('state.emptyTitle', radiusLabel(radiusKm, unit))}
          body={`${t('state.emptyBody', f.label, f.pumpCode)} ${wider ? t('state.emptyTryWider') : t('state.emptyTryOther')}`}
          testID="state-empty"
        >
          {wider ? (
            <Button label={t('state.searchWithin', radiusLabel(toKm(wider, unit), unit))} size="lg" fullWidth onPress={() => updateSettings({ radiusKm: toKm(wider, unit) })} testID="widen" />
          ) : null}
        </EmptyState>
      );
    }
  }
}
