import type { ReactNode } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, layout } from '@/theme';

type ScreenProps = {
  children: ReactNode;
  /** A tab screen leaves room for the floating tab bar. */
  tab?: boolean;
  /** Pinned under the scrolling content: the screen's main action. */
  footer?: ReactNode;
};

/** A scrolling screen with the design's padding and the space background. */
export function Screen({ children, tab = false, footer }: ScreenProps) {
  const insets = useSafeAreaInsets();
  const bottom = tab ? layout.tabBarClearance : footer ? layout.section : insets.bottom + layout.section;
  return (
    <View style={{ flex: 1, backgroundColor: colors.space }}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + layout.top,
          paddingHorizontal: layout.gutter,
          paddingBottom: bottom,
          gap: layout.section,
        }}
        showsVerticalScrollIndicator={false}>
        {children}
      </ScrollView>
      {footer ? (
        <View style={{ paddingHorizontal: layout.gutter, paddingTop: 12, paddingBottom: insets.bottom + 12 }}>
          {footer}
        </View>
      ) : null}
    </View>
  );
}
