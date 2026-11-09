import { router } from 'expo-router';

import { Button, Placeholder, Screen, ScreenHeader } from '@/components';

/** Yer kontrolü 2/2 — next week's route (Figma 10). */
export default function ReviewPlanScreen() {
  return (
    <Screen footer={<Button label="Rotayı onayla" onPress={() => router.dismissAll()} />}>
      <ScreenHeader back overline="Yer kontrolü · 2/2" title="Hafta 46 rotası" />
      <Placeholder figmaFrame="10 Hafta 46 rotası — haftalık review 2/2" />
    </Screen>
  );
}
