import type { Href } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import { goBack } from '@/lib/navigation';
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
  /** Where back goes when there is no previous screen (opened from a link). */
  fallback?: Href;
  /** Right of the overline: "~10 dk", the + button. */
  aside?: ReactNode;
  /** Right of the title: the fuel counter on Görev. */
  titleAside?: ReactNode;
};

export function ScreenHeader({
  overline,
  title,
  subtitle,
  accent = 'acid',
  back = false,
  fallback = '/',
  aside,
  titleAside,
}: ScreenHeaderProps) {
  return (
    <View style={{ gap: 10 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        {back ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Geri"
            onPress={() => goBack(fallback)}
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
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
        <Txt variant="displayXL" accessibilityRole="header" style={{ flex: 1 }}>
          {title}
        </Txt>
        {titleAside}
      </View>
      {subtitle ? <Txt color="moonMid">{subtitle}</Txt> : null}
    </View>
  );
}
