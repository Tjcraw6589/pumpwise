import type { ReactNode } from 'react';
import { Linking, Pressable, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Header } from '@/components/Header';
import { Screen } from '@/components/Screen';
import { FUEL_FINDER_URL, OGL_URL, REPORT_PRICE_URL } from '@/config/app';
import { useNow } from '@/hooks/useNearby';
import { timeAgo } from '@/lib/format';
import { useLive } from '@/store/useLive';
import { useTheme } from '@/theme/useTheme';

function Para({ title, children }: { title: string; children: ReactNode }) {
  const { spacing } = useTheme();
  return (
    <View style={{ marginTop: spacing.lg }}>
      <AppText variant="h3" style={{ marginBottom: spacing.xs }}>
        {title}
      </AppText>
      <AppText variant="body" tone="muted">
        {children}
      </AppText>
    </View>
  );
}

function Link({ label, url }: { label: string; url: string }) {
  const { spacing } = useTheme();
  return (
    <Pressable accessibilityRole="link" onPress={() => void Linking.openURL(url)} hitSlop={6} style={{ marginTop: spacing.sm }}>
      <AppText variant="bodyBold" tone="accent">
        {label}
      </AppText>
    </Pressable>
  );
}

/** Where prices come from, how fresh they are and how "best value" is worked out. */
export default function AboutScreen() {
  const { spacing } = useTheme();
  const meta = useLive((s) => s.meta);
  const now = useNow();
  return (
    <Screen scroll edges={['top', 'bottom']} testID="about-screen">
      <Header title="Where prices come from" dismiss="back" />
      <AppText variant="body">
        Pumpwise shows prices from the UK Government&apos;s Fuel Finder scheme. Since February 2026 the law requires every forecourt in
        the UK to report its prices, and to report any change within 30 minutes.
      </AppText>
      {meta?.status === 'live' ? (
        <AppText variant="caption" tone="muted" style={{ marginTop: spacing.sm }} testID="about-feed">
          The Pumpwise feed was last rebuilt {timeAgo(meta.generatedAt, now)} and covers {meta.stationCount.toLocaleString('en-GB')} forecourts.
        </AppText>
      ) : null}
      <Para title="How fresh are the prices?">
        Pumpwise collects the official prices every 15 minutes. Each price shows when the forecourt last reported it. An older time
        usually means the price has not changed. Prices not confirmed for a month are never picked as the cheapest or nearest.
      </Para>
      <Para title="Cheapest, nearest and best value">
        Cheapest is the lowest price inside your search area at a station that is open. Nearest is the closest open station that
        sells your fuel. Best value adds the fuel you would burn driving there and back, using your car&apos;s miles per gallon, so a
        slightly dearer station next door can beat a cheap one miles away.
      </Para>
      <Para title="Distances">Distances are in a straight line. Roads are longer, so expect the drive to be a little further.</Para>
      <Para title="Spotted a wrong price?">
        If the pump price doesn&apos;t match, you can report it to GOV.UK. Reports go to the scheme and can be passed to the forecourt or
        Trading Standards.
      </Para>
      <Link label="Report a wrong price" url={REPORT_PRICE_URL} />
      <Para title="Licence">
        Contains public sector information licensed under the Open Government Licence v3.0. Pumpwise is not affiliated with the UK
        Government.
      </Para>
      <Link label="About the Fuel Finder scheme" url={FUEL_FINDER_URL} />
      <Link label="Open Government Licence v3.0" url={OGL_URL} />
      <View style={{ height: spacing.xxl }} />
    </Screen>
  );
}
