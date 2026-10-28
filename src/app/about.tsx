import type { ReactNode } from 'react';
import { Linking, Pressable, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Header } from '@/components/Header';
import { Screen } from '@/components/Screen';
import { useNow } from '@/hooks/useNearby';
import { useCoverage } from '@/hooks/useRegion';
import { timeAgo } from '@/lib/format';
import { REGIONS } from '@/lib/regions';
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

function Link({ label, url, testID }: { label: string; url: string; testID?: string }) {
  const { spacing } = useTheme();
  return (
    <Pressable accessibilityRole="link" onPress={() => void Linking.openURL(url)} hitSlop={6} style={{ marginTop: spacing.sm }} testID={testID}>
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
  const coverage = useCoverage();
  const now = useNow();
  return (
    <Screen scroll edges={['top', 'bottom']} testID="about-screen">
      <Header title="Where prices come from" dismiss="back" />
      <AppText variant="body">
        Pumpwise shows official prices that stations must report to government price schemes. It adds a new place whenever a
        government publishes its prices for free.
      </AppText>
      {meta ? (
        <AppText variant="caption" tone="muted" style={{ marginTop: spacing.sm }} testID="about-feed">
          The Pumpwise feed was last rebuilt {timeAgo(meta.generatedAt, now)} and covers {meta.stationCount.toLocaleString('en-AU')} stations.
        </AppText>
      ) : null}

      {coverage.live.map((id) => {
        const region = REGIONS[id];
        return (
          <View key={id} testID={`about-${id}`}>
            <Para title={region.name}>{region.about}</Para>
            <AppText variant="caption" tone="muted" style={{ marginTop: spacing.xs }}>
              {region.source.credit}.
            </AppText>
            <Link label={region.source.url.replace(/^https:\/\//, '')} url={region.source.url} testID={`about-source-${id}`} />
            <Link label={`Price wrong? ${region.report.label}`} url={region.report.url} />
          </View>
        );
      })}

      <Para title="Cheapest, nearest and best value">
        Cheapest is the lowest price inside your search area at a station that is open. Nearest is the closest open station that
        sells your fuel. Best value adds the fuel you would burn driving there and back, using your car&apos;s fuel use, so a slightly
        dearer station next door can beat a cheap one far away.
      </Para>
      <Para title="Members-only and remote stations">
        Stations that only sell to members, or that need an entry permit, are labelled and never picked as the cheapest. If you are a
        member, you can include members-only stations in Settings.
      </Para>
      <Para title="Distances">Distances are in a straight line. Roads are longer, so expect the drive to be a little further.</Para>
      <Para title="Independence">Pumpwise is not affiliated with any government, station or fuel brand.</Para>
      <View style={{ height: spacing.xxl }} />
    </Screen>
  );
}
