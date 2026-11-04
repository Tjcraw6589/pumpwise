import type { ReactNode } from 'react';
import { Linking, Pressable, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Header } from '@/components/Header';
import { Screen } from '@/components/Screen';
import { useNow } from '@/hooks/useNearby';
import { useCoverage } from '@/hooks/useRegion';
import { formatCount, t } from '@/i18n';
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
      <Header title={t('about.title')} dismiss="back" />
      <AppText variant="body">{t('about.intro')}</AppText>
      {meta ? (
        <AppText variant="caption" tone="muted" style={{ marginTop: spacing.sm }} testID="about-feed">
          {t('about.feed', timeAgo(meta.generatedAt, now), formatCount(meta.stationCount))}
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
            <Link label={t('about.priceWrong', region.report.label)} url={region.report.url} />
          </View>
        );
      })}

      <Para title={t('about.rankTitle')}>{t('about.rankBody')}</Para>
      <Para title={t('about.membersTitle')}>{t('about.membersBody')}</Para>
      <Para title={t('about.distanceTitle')}>{t('about.distanceBody')}</Para>
      <Para title={t('about.independenceTitle')}>{t('about.independenceBody')}</Para>
      <View style={{ height: spacing.xxl }} />
    </Screen>
  );
}
