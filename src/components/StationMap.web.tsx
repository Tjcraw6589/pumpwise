import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme/useTheme';

import { AppText } from './AppText';
import { MapPin } from './MapPin';
import type { StationMapProps } from './StationMap.types';

export type { StationMapProps } from './StationMap.types';

/**
 * Web preview only (the iPhone app uses Apple Maps): stations placed by their real offsets from the
 * search centre on a plain grid, so the map screen can be checked in a browser.
 */
export function StationMap({ center, radiusMiles, stations, band, selectedId, onSelect }: StationMapProps) {
  const { colors } = useTheme();
  const [size, setSize] = useState({ width: 0, height: 0 });
  const half = Math.min(size.width, size.height) / 2;
  const scale = half / (radiusMiles * 1.15);
  const cos = Math.cos((center.lat * Math.PI) / 180);

  return (
    <View
      style={[StyleSheet.absoluteFill, { backgroundColor: colors.surfaceAlt }]}
      onLayout={(e) => setSize({ width: e.nativeEvent.layout.width, height: e.nativeEvent.layout.height })}
      testID="station-map"
    >
      <Pressable style={StyleSheet.absoluteFill} onPress={() => onSelect(null)} accessibilityLabel="Map background" />
      {half > 0 ? (
        <>
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              left: size.width / 2 - radiusMiles * scale,
              top: size.height / 2 - radiusMiles * scale,
              width: radiusMiles * scale * 2,
              height: radiusMiles * scale * 2,
              borderRadius: radiusMiles * scale,
              borderWidth: 1.5,
              borderColor: colors.mapCircle,
              backgroundColor: colors.mapCircleFill,
            }}
          />
          <View pointerEvents="none" style={[styles.me, { left: size.width / 2 - 8, top: size.height / 2 - 8, backgroundColor: '#2F80ED' }]} />
          {stations.map((item) => {
            const x = size.width / 2 + (item.station.lng - center.lng) * 69.172 * cos * scale;
            const y = size.height / 2 - (item.station.lat - center.lat) * 69.0 * scale;
            const selected = item.station.id === selectedId;
            return (
              <Pressable
                key={item.station.id}
                accessibilityRole="button"
                accessibilityLabel={`${item.station.name} pin`}
                testID={`map-pin-${item.station.id}`}
                onPress={() => onSelect(item.station.id)}
                style={{ position: 'absolute', left: x - 30, top: y - 30, width: 60, alignItems: 'center', zIndex: selected ? 10 : 1 }}
              >
                <MapPin pence={item.price.p} band={band(item.price.p)} selected={selected} stale={item.stale} />
              </Pressable>
            );
          })}
        </>
      ) : null}
      <AppText variant="caption" tone="faint" style={styles.note}>
        Map preview. The iPhone app shows Apple Maps.
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  me: { position: 'absolute', width: 16, height: 16, borderRadius: 8, borderWidth: 3, borderColor: '#FFFFFF' },
  note: { position: 'absolute', left: 12, bottom: 8 },
});
