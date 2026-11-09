import { Text, type TextProps } from 'react-native';

import { colors, typography, type ColorToken, type TypographyVariant } from '@/theme';

type TxtProps = TextProps & {
  variant?: TypographyVariant;
  color?: ColorToken;
};

/** Text in one of the design's text styles. */
export function Txt({ variant = 'body', color = 'moon', style, ...props }: TxtProps) {
  return <Text {...props} style={[typography[variant], { color: colors[color] }, style]} />;
}
