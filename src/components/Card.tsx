import { View, type ViewProps } from 'react-native';

import { colors, layout, type ColorToken } from '@/theme';

type CardProps = ViewProps & {
  /** A colored outline: acid for the current item, nebula for Kule's notes, signal for warnings. */
  border?: ColorToken;
  /** Background; defaults to the card color. */
  fill?: ColorToken;
};

export function Card({ border, fill = 'cabin', style, ...props }: CardProps) {
  return (
    <View
      {...props}
      style={[
        {
          backgroundColor: colors[fill],
          borderRadius: layout.cardRadius,
          padding: layout.cardPadding,
          borderWidth: border ? 1 : 0,
          borderColor: border ? colors[border] : undefined,
        },
        style,
      ]}
    />
  );
}
