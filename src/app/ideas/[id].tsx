import { router } from 'expo-router';
import { View } from 'react-native';

import { Button, Placeholder, Screen, ScreenHeader } from '@/components';

/** Uydu değerlendirmesi — one idea and Kule's proposal for it (Figma 06). */
export default function IdeaScreen() {
  return (
    <Screen
      footer={
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <Button kind="ghost" label="Park et" onPress={() => router.back()} />
          <Button label="Keşfi başlat" onPress={() => router.back()} style={{ flex: 1 }} />
        </View>
      }>
      <ScreenHeader back accent="moonMid" overline="Uydu değerlendirmesi" title="AI Engineering" />
      <Placeholder figmaFrame="06 Uydu değerlendirmesi — AI Engineering" />
    </Screen>
  );
}
