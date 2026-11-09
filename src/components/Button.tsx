import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';

import { colors, layout } from '@/theme';

import { Txt } from './Txt';

type ButtonProps = Omit<PressableProps, 'style' | 'children'> & {
  label: string;
  /** primary: acid fill ("Görevi başlat"); ghost: outlined ("Reddet", "Park et"). */
  kind?: 'primary' | 'ghost';
  style?: StyleProp<ViewStyle>;
};

export function Button({ label, kind = 'primary', style, disabled, ...props }: ButtonProps) {
  const primary = kind === 'primary';
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      {...props}
      style={({ pressed }) => [
        {
          height: layout.buttonHeight,
          borderRadius: layout.buttonHeight / 2,
          paddingHorizontal: 24,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: primary ? colors.acid : 'transparent',
          borderWidth: primary ? 0 : 1,
          borderColor: colors.line,
          opacity: disabled ? 0.4 : pressed ? 0.8 : 1,
        },
        style,
      ]}>
      <Txt variant="bodyStrong" color={primary ? 'acidInk' : 'moon'} style={{ fontSize: 15 }}>
        {label}
      </Txt>
    </Pressable>
  );
}
