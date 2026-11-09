import type { TextStyle } from 'react-native';

/**
 * Fonts loaded in the root layout. The design's own families are not known (view-only access to the Figma file):
 * Unbounded stands in for the wide geometric display face, Manrope for the body face.
 */
export const fontAssets = {
  'Unbounded-Medium': require('@expo-google-fonts/unbounded/500Medium/Unbounded_500Medium.ttf'),
  'Unbounded-SemiBold': require('@expo-google-fonts/unbounded/600SemiBold/Unbounded_600SemiBold.ttf'),
  'Unbounded-Bold': require('@expo-google-fonts/unbounded/700Bold/Unbounded_700Bold.ttf'),
  'Manrope-Medium': require('@expo-google-fonts/manrope/500Medium/Manrope_500Medium.ttf'),
  'Manrope-SemiBold': require('@expo-google-fonts/manrope/600SemiBold/Manrope_600SemiBold.ttf'),
  'Manrope-Bold': require('@expo-google-fonts/manrope/700Bold/Manrope_700Bold.ttf'),
  'Manrope-ExtraBold': require('@expo-google-fonts/manrope/800ExtraBold/Manrope_800ExtraBold.ttf'),
};

/** Text styles of the design (Figma › 00 Temeller › Metin stilleri): size / line height. */
export const typography = {
  /** Screen titles: "Bu haftanın itkisi". */
  displayXL: { fontFamily: 'Unbounded-Bold', fontSize: 28, lineHeight: 32, letterSpacing: -0.6 },
  /** Big numbers and card headlines: "KEŞİF · 2 saat". */
  displayL: { fontFamily: 'Unbounded-Bold', fontSize: 22, lineHeight: 27, letterSpacing: -0.4 },
  /** Stat values: "3 / 4". */
  displayM: { fontFamily: 'Unbounded-SemiBold', fontSize: 18, lineHeight: 23, letterSpacing: -0.2 },
  /** Counters: "3:50 / 4 sa". */
  counter: { fontFamily: 'Unbounded-SemiBold', fontSize: 14, lineHeight: 17 },
  /** Section labels: "ROTADAKİ 3 ADIM". */
  overline: {
    fontFamily: 'Manrope-ExtraBold',
    fontSize: 10,
    lineHeight: 13,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  },
  /** Card titles: "Kredi akışını çiz, doğrulat". */
  cardTitle: { fontFamily: 'Manrope-Bold', fontSize: 16, lineHeight: 21 },
  body: { fontFamily: 'Manrope-Medium', fontSize: 14, lineHeight: 20 },
  bodyStrong: { fontFamily: 'Manrope-Bold', fontSize: 14, lineHeight: 20 },
  small: { fontFamily: 'Manrope-Medium', fontSize: 12, lineHeight: 17 },
  /** Pills and tab labels. */
  micro: { fontFamily: 'Manrope-Bold', fontSize: 11, lineHeight: 13, letterSpacing: 0.4 },
} satisfies Record<string, TextStyle>;

export type TypographyVariant = keyof typeof typography;
