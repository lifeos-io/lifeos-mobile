import type { TabListProps, TabTriggerSlotProps } from 'expo-router/ui';
import type { ComponentType } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, layout, type ColorToken } from '@/theme';

import { EyeIcon, SatellitesIcon, TelemetryIcon, TowerIcon } from './icons';
import { Txt } from './Txt';

export type Tab = {
  name: 'index' | 'ideas' | 'evidence' | 'coach';
  href: '/' | '/ideas' | '/evidence' | '/coach';
  label: string;
  Icon: ComponentType<{ color?: ColorToken }>;
};

export const tabs: Tab[] = [
  { name: 'index', href: '/', label: 'Görev', Icon: EyeIcon },
  { name: 'ideas', href: '/ideas', label: 'Uydular', Icon: SatellitesIcon },
  { name: 'evidence', href: '/evidence', label: 'Telemetri', Icon: TelemetryIcon },
  { name: 'coach', href: '/coach', label: 'Kule', Icon: TowerIcon },
];

/*
 * Used as `<TabList asChild><TabBarFrame>{<TabTrigger asChild><TabButton/></TabTrigger>…}</TabBarFrame></TabList>`
 * directly in the tabs layout: expo-router finds the tabs only there. Children of TabList / TabTrigger (asChild)
 * must get flat styles: expo-router's Slot rejects style arrays.
 */

/** The floating bottom bar: a rounded card over the content. */
export function TabBarFrame({ children, style: _style, ...props }: TabListProps) {
  const insets = useSafeAreaInsets();
  return (
    <View {...props} style={StyleSheet.flatten([styles.wrapper, { bottom: Math.max(insets.bottom - 6, 12) }])}>
      <View style={styles.bar}>{children}</View>
    </View>
  );
}

/** One tab: icon and label, acid when active. */
export function TabButton({
  label,
  Icon,
  isFocused,
  // The trigger's View ref does not fit Pressable's ref type; the button works without it.
  ref: _ref,
  ...props
}: TabTriggerSlotProps & Pick<Tab, 'label' | 'Icon'>) {
  const color: ColorToken = isFocused ? 'acid' : 'moonMid';
  return (
    <Pressable
      {...props}
      accessibilityRole="tab"
      accessibilityState={{ selected: isFocused }}
      style={({ pressed }) => StyleSheet.flatten([styles.tab, pressed && { opacity: 0.7 }])}>
      <Icon color={color} />
      <Txt variant="micro" color={color} style={{ letterSpacing: 0 }}>
        {label}
      </Txt>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: layout.gutter - 4,
    right: layout.gutter - 4,
  },
  bar: {
    flexDirection: 'row',
    backgroundColor: colors.cabin,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: colors.line,
    paddingVertical: 10,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    paddingVertical: 2,
  },
});
