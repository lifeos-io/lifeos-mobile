import { Placeholder, Screen, ScreenHeader } from '@/components';

/** Kule — koç (Figma 11). */
export default function CoachScreen() {
  return (
    <Screen tab>
      <ScreenHeader overline="Kontrol kulesi" title="Sor. Cevap kayda bağlansın." accent="nebula" />
      <Placeholder figmaFrame="11 Kule — koç" />
    </Screen>
  );
}
