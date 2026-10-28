import { useEffect, useRef } from 'react';
import { StyleSheet } from 'react-native';
import MapView, { Circle, Marker } from 'react-native-maps';

import { regionForRadius } from '@/lib/geo';
import { useTheme } from '@/theme/useTheme';

import { MapPin } from './MapPin';
import type { StationMapProps } from './StationMap.types';

export type { StationMapProps } from './StationMap.types';

const METRES_PER_MILE = 1609.344;

/** Apple Maps with a price sign on every station in the search area. */
export function StationMap({ center, radiusMiles, stations, band, selectedId, onSelect, showsUserLocation, recenterToken }: StationMapProps) {
  const { colors, scheme } = useTheme();
  const map = useRef<MapView>(null);

  useEffect(() => {
    map.current?.animateToRegion(regionForRadius(center, radiusMiles), 450);
    // Fly back when the area changes or the driver taps "recentre"; small GPS moves don't move the map.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [radiusMiles, recenterToken, Math.round(center.lat * 50), Math.round(center.lng * 50)]);

  return (
    <MapView
      ref={map}
      style={StyleSheet.absoluteFill}
      initialRegion={regionForRadius(center, radiusMiles)}
      showsUserLocation={showsUserLocation}
      showsPointsOfInterests={false}
      showsCompass={false}
      userInterfaceStyle={scheme}
      pitchEnabled={false}
      onPress={() => onSelect(null)}
      testID="station-map"
    >
      <Circle
        center={{ latitude: center.lat, longitude: center.lng }}
        radius={radiusMiles * METRES_PER_MILE}
        strokeColor={colors.mapCircle}
        fillColor={colors.mapCircleFill}
        strokeWidth={1.5}
      />
      {stations.map((item) => {
        const selected = item.station.id === selectedId;
        return (
          <Marker
            key={`${item.station.id}-${selected ? 's' : 'n'}`}
            identifier={item.station.id}
            coordinate={{ latitude: item.station.lat, longitude: item.station.lng }}
            anchor={{ x: 0.5, y: 1 }}
            zIndex={selected ? 1000 : band(item.price.p) === 'low' ? 10 : 1}
            tracksViewChanges={false}
            onPress={(event) => {
              event.stopPropagation();
              onSelect(item.station.id);
            }}
          >
            <MapPin pence={item.price.p} band={band(item.price.p)} selected={selected} stale={item.stale} />
          </Marker>
        );
      })}
    </MapView>
  );
}
