import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import { colors, type ColorToken } from '@/theme';

import { ChevronLeftIcon } from './icons';
import { Txt } from './Txt';

type ScreenHeaderProps = {
  overline: string;
  title: string;
  subtitle?: string;
  /** Overline color: acid on most screens, nebula on Kule's and proposals' screens, moonMid on records. */
  accent?: ColorToken;
  /** Shows the round back button left of the overline. */
  back?: boolean;
  /** Right of the overline or the title: "~10 dk", the fuel counter, the + button. */
  aside?: ReactNode;
};

export function ScreenHeader({ overline, title, subtitle, accent = 'acid', back = false, aside }: ScreenHeaderProps) {
  return (
    <View style={{ gap: 10 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        {back ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Geri"
            onPress={() => router.back()}
            hitSlop={8}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: colors.cabinRaised,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <ChevronLeftIcon />
          </Pressable>
        ) : null}
        <Txt variant="overline" color={accent} style={{ flex: 1 }}>
          {overline}
        </Txt>
        {aside}
      </View>
      <Txt variant="displayXL" accessibilityRole="header">
        {title}
      </Txt>
      {subtitle ? <Txt color="moonMid">{subtitle}</Txt> : null}
    </View>
  );
}
