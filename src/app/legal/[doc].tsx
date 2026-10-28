import { useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Header } from '@/components/Header';
import { Screen } from '@/components/Screen';
import { LEGAL_DOCS } from '@/content/legal.generated';
import { useTheme } from '@/theme/useTheme';

/** Renders the small Markdown subset used by the legal documents: #, ##, ###, "- " bullets and paragraphs. */
function MarkdownLite({ source }: { source: string }) {
  const { spacing } = useTheme();
  const blocks = source.split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);
  return (
    <View>
      {blocks.map((block, i) => {
        // The title and date are rendered by the screen header, not repeated in the body.
        if (block.startsWith('# ') || block.startsWith('Last updated:')) return null;
        if (block.startsWith('## ')) {
          return (
            <AppText key={i} variant="h3" style={{ marginTop: spacing.lg, marginBottom: spacing.xs }}>
              {block.slice(3)}
            </AppText>
          );
        }
        if (block.startsWith('### ')) {
          return (
            <AppText key={i} variant="bodyBold" style={{ marginTop: spacing.md, marginBottom: spacing.xs }}>
              {block.slice(4)}
            </AppText>
          );
        }
        if (block.startsWith('- ')) {
          return (
            <View key={i} style={{ marginBottom: spacing.sm }}>
              {block.split('\n').map((line, j) => (
                <View key={j} style={{ flexDirection: 'row', marginBottom: 4 }}>
                  <AppText variant="body" tone="muted" style={{ width: 16 }}>
                    •
                  </AppText>
                  <AppText variant="body" style={{ flex: 1 }}>
                    {line.replace(/^- /, '')}
                  </AppText>
                </View>
              ))}
            </View>
          );
        }
        return (
          <AppText key={i} variant="body" style={{ marginBottom: spacing.sm }}>
            {block.replace(/\n/g, ' ')}
          </AppText>
        );
      })}
    </View>
  );
}

export default function LegalScreen() {
  const { doc } = useLocalSearchParams<{ doc: string }>();
  const { spacing } = useTheme();
  const entry = doc === 'terms' ? LEGAL_DOCS.terms : LEGAL_DOCS.privacy;
  return (
    <Screen scroll edges={['top', 'bottom']} testID="legal-screen">
      <Header title={entry.title} dismiss="back" />
      <AppText variant="caption" tone="muted" style={{ marginBottom: spacing.sm }}>
        Last updated {entry.updated}
      </AppText>
      <MarkdownLite source={entry.markdown} />
      <View style={{ height: spacing.xxl }} />
    </Screen>
  );
}
