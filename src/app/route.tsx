import { Placeholder, Screen, ScreenHeader } from '@/components';

/** Rota — varış ve aşamalar (Figma 03). */
export default function RouteScreen() {
  return (
    <Screen>
      <ScreenHeader
        back
        overline="Varış noktası"
        title="Kadrolu pozisyon"
        subtitle="Pencere: Mayıs – Kasım 2027 · senin hedefin, işverenin taahhüdü değil"
      />
      <Placeholder figmaFrame="03 Rota — varış ve aşamalar" />
    </Screen>
  );
}
