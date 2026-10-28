import { useRouter } from 'expo-router';

import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';

export default function NotFoundScreen() {
  const router = useRouter();
  return (
    <Screen edges={['top', 'bottom']}>
      <EmptyState icon="compass-outline" title="Wrong turn" body="That page doesn't exist in Pumpwise.">
        <Button label="Back to nearby prices" size="lg" fullWidth onPress={() => router.replace('/')} />
      </EmptyState>
    </Screen>
  );
}
