import { Placeholder, Screen, ScreenHeader } from '@/components';

/** Uydular — fikir kutusu (Figma 05). */
export default function IdeasScreen() {
  return (
    <Screen tab>
      <ScreenHeader
        overline="Yörüngede 4 uydu"
        title="Uydular"
        subtitle="Yeni fikirler rotanı değiştirmez. Yer kontrolünde karara bağlanır."
      />
      <Placeholder figmaFrame="05 Uydular — fikir kutusu" />
    </Screen>
  );
}
