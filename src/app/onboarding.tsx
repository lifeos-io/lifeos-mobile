import { router } from 'expo-router';

import { Button, Placeholder, Screen, ScreenHeader } from '@/components';

/** Görev tanımı — onboarding (Figma 01). */
export default function OnboardingScreen() {
  return (
    <Screen footer={<Button label="Görevi başlat" onPress={() => router.back()} />}>
      <ScreenHeader
        back
        overline="Görev tanımı"
        title="12 ay sonra ne değişmiş olsun?"
        subtitle="Tek bir varış noktası seç. Diğer hedefler uydu olarak yörüngede bekleyebilir."
      />
      <Placeholder figmaFrame="01 Görev tanımı (onboarding)" />
    </Screen>
  );
}
