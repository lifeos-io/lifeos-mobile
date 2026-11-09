import { View } from 'react-native';

import { colors, type ColorToken } from '@/theme';

type ProgressBarProps = {
  /** 0..1; values above 1 fill the bar. */
  value: number;
  color?: ColorToken;
  height?: number;
};

export function ProgressBar({ value, color = 'acid', height = 6 }: ProgressBarProps) {
  const filled = Math.max(0, Math.min(1, value));
  return (
    <View style={{ height, borderRadius: height / 2, backgroundColor: colors.cabinRaised, overflow: 'hidden' }}>
      <View style={{ width: `${filled * 100}%`, height, borderRadius: height / 2, backgroundColor: colors[color] }} />
    </View>
  );
}
