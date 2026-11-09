import { View } from 'react-native';

import { colors, type ColorToken } from '@/theme';

import { Txt } from './Txt';

export type PillTone = 'acid' | 'nebula' | 'signal' | 'ghost' | 'muted';

const tones: Record<PillTone, { background: ColorToken | null; border: ColorToken | null; text: ColorToken }> = {
  acid: { background: 'acid', border: null, text: 'acidInk' },
  nebula: { background: 'nebula', border: null, text: 'nebulaInk' },
  signal: { background: 'signal', border: null, text: 'signalInk' },
  ghost: { background: null, border: 'line', text: 'moonMid' },
  muted: { background: 'cabinRaised', border: null, text: 'moonMid' },
};

/** A small rounded label: "ŞİMDİ · T+8", "PARK", "DOĞRULANMADI". */
export function Pill({ label, tone = 'muted' }: { label: string; tone?: PillTone }) {
  const { background, border, text } = tones[tone];
  return (
    <View
      style={{
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 999,
        backgroundColor: background ? colors[background] : 'transparent',
        borderWidth: border ? 1 : 0,
        borderColor: border ? colors[border] : undefined,
      }}>
      <Txt variant="micro" color={text}>
        {label.toLocaleUpperCase('tr-TR')}
      </Txt>
    </View>
  );
}
