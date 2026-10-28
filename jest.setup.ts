// Jest runs on Node, so native-only modules are replaced with light doubles here.
// The pricing, ranking and feed logic under src/lib is pure and needs none of this.
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

// Icon fonts are binary assets; render the icon name as text instead.
jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');
  const Icon = (props: { name?: string }) => React.createElement(Text, props, props.name ?? 'icon');
  Icon.glyphMap = {};
  return new Proxy({}, { get: () => Icon });
});

jest.mock('@expo-google-fonts/barlow-condensed', () => ({
  useFonts: () => [true, null],
  BarlowCondensed_600SemiBold: 'BarlowCondensed_600SemiBold',
  BarlowCondensed_700Bold: 'BarlowCondensed_700Bold',
}));

jest.mock('expo-splash-screen', () => ({
  preventAutoHideAsync: jest.fn(async () => true),
  hide: jest.fn(),
  hideAsync: jest.fn(async () => undefined),
  setOptions: jest.fn(),
}));

jest.mock('expo-system-ui', () => ({
  setBackgroundColorAsync: jest.fn(async () => undefined),
}));

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(async () => undefined),
  notificationAsync: jest.fn(async () => undefined),
  selectionAsync: jest.fn(async () => undefined),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium' },
  NotificationFeedbackType: { Success: 'success', Warning: 'warning', Error: 'error' },
}));

// Location: granted by default, at Westminster. Tests change these mocks to cover other states.
jest.mock('expo-location', () => {
  const position = { coords: { latitude: 51.5072, longitude: -0.1276, accuracy: 20 }, timestamp: 0 };
  return {
    Accuracy: { Balanced: 3, High: 4 },
    getForegroundPermissionsAsync: jest.fn(async () => ({ granted: true, status: 'granted', canAskAgain: true })),
    requestForegroundPermissionsAsync: jest.fn(async () => ({ granted: true, status: 'granted', canAskAgain: true })),
    getCurrentPositionAsync: jest.fn(async () => position),
    getLastKnownPositionAsync: jest.fn(async () => position),
    watchPositionAsync: jest.fn(async () => ({ remove: jest.fn() })),
    reverseGeocodeAsync: jest.fn(async () => [{ district: 'Westminster', city: 'London' }]),
  };
});

jest.mock('react-native-svg', () => {
  const React = require('react');
  const { View } = require('react-native');
  const Stub = ({ children, testID }: { children?: unknown; testID?: string }) => React.createElement(View, { testID }, children);
  return { __esModule: true, default: Stub, Svg: Stub, Path: Stub, Defs: Stub, LinearGradient: Stub, Stop: Stub };
});

jest.mock('react-native-maps', () => {
  const React = require('react');
  const { View } = require('react-native');
  class MapView extends React.Component<{ children?: unknown; testID?: string }> {
    animateToRegion() {}
    render() {
      return React.createElement(View, { testID: this.props.testID }, this.props.children);
    }
  }
  const Stub = ({ children }: { children?: unknown }) => React.createElement(View, null, children);
  return { __esModule: true, default: MapView, Marker: Stub, Circle: Stub, PROVIDER_DEFAULT: null };
});
