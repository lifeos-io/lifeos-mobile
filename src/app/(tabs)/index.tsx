import { Link, type Href } from 'expo-router';
import { Pressable, View } from 'react-native';

import { Card, ChevronRightIcon, Placeholder, Screen, ScreenHeader, Txt } from '@/components';

/** Temporary: reaches every screen until the real entry points are built. */
const screens: { href: Href; label: string }[] = [
  { href: '/onboarding', label: '01 Görev tanımı' },
  { href: '/route', label: '03 Rota' },
  { href: '/proposals/demo', label: '04 Rota düzeltmesi' },
  { href: '/ideas/demo', label: '06 Uydu değerlendirmesi' },
  { href: '/decisions/demo', label: '07 Manevra kaydı' },
  { href: '/review', label: '09 Yer kontrolü' },
];

/** Görev — bugün (Figma 02). */
export default function MissionScreen() {
  return (
    <Screen tab>
      <ScreenHeader overline="Aşama 1 · T+8 gün" title="Bu haftanın itkisi" />
      <Placeholder figmaFrame="02 Görev — bugün" />
      <View style={{ gap: 8 }}>
        <Txt variant="overline" color="moonMid">
          Ekranlar (geçici)
        </Txt>
        {screens.map(({ href, label }) => (
          <Link key={label} href={href} asChild>
            <Pressable>
              <Card style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Txt variant="bodyStrong" style={{ flex: 1 }}>
                  {label}
                </Txt>
                <ChevronRightIcon color="moonMid" />
              </Card>
            </Pressable>
          </Link>
        ))}
      </View>
    </Screen>
  );
}
