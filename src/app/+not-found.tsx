import { useRouter } from 'expo-router';

import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import { t } from '@/i18n';

export default function NotFoundScreen() {
  const router = useRouter();
  return (
    <Screen edges={['top', 'bottom']}>
      <EmptyState icon="compass-outline" title={t('notFound.title')} body={t('notFound.body')}>
        <Button label={t('notFound.back')} size="lg" fullWidth onPress={() => router.replace('/')} />
      </EmptyState>
    </Screen>
  );
}
