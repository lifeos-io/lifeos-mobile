import { router } from 'expo-router';
import { View } from 'react-native';

import { Button, Placeholder, Screen, ScreenHeader } from '@/components';

/** Rota düzeltmesi — a strategy revision proposal (Figma 04). */
export default function ProposalScreen() {
  return (
    <Screen
      footer={
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <Button kind="ghost" label="Reddet" onPress={() => router.back()} />
          <Button label="Onayla, v3'e geç" onPress={() => router.back()} style={{ flex: 1 }} />
        </View>
      }>
      <ScreenHeader back accent="nebula" overline="Rota düzeltmesi · v2 → v3" title="Hedef aynı. Ağırlıklar değişiyor." />
      <Placeholder figmaFrame="04 Rota düzeltmesi" />
    </Screen>
  );
}
