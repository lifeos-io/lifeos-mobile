import { router } from 'expo-router';

import { Button, Placeholder, Screen, ScreenHeader, Txt } from '@/components';

/** Yer kontrolü 1/2 — the week's numbers and Kule's findings (Figma 09). */
export default function ReviewScreen() {
  return (
    <Screen footer={<Button label="Önerilere geç" onPress={() => router.push('/review/plan')} />}>
      <ScreenHeader
        back
        overline="Yer kontrolü · Hafta 45"
        title="Haftanın telemetrisi"
        aside={
          <Txt variant="small" color="moonMid">
            ~10 dk
          </Txt>
        }
      />
      <Placeholder figmaFrame="09 Yer kontrolü — haftalık review 1/2" />
    </Screen>
  );
}
