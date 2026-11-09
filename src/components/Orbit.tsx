import { useState } from 'react';
import { View, type LayoutChangeEvent } from 'react-native';
import Svg, { Circle, Ellipse } from 'react-native-svg';

import { colors } from '@/theme';

import { Txt } from './Txt';

export type Satellite = { key: string; label: string };

type OrbitProps = {
  /** At most four are drawn, in slot order. */
  satellites: Satellite[];
  caption?: string;
  /** Draws "sen" on the inner orbit (the Görev screen). */
  showSelf?: boolean;
  height?: number;
};

/** Where a dot sits: on which ellipse, at which angle, and where its label goes. */
type Slot = { orbit: 'outer' | 'inner'; angle: number; label: 'left' | 'below' | 'right' };

const slots: Slot[] = [
  { orbit: 'outer', angle: -12, label: 'left' },
  { orbit: 'inner', angle: 62, label: 'right' },
  { orbit: 'outer', angle: 168, label: 'below' },
  { orbit: 'inner', angle: -60, label: 'right' },
];
const selfSlot: Slot = { orbit: 'inner', angle: -122, label: 'right' };

const DOT = 10;
const LABEL_WIDTH = 140;

/** The goal as a sun, ideas as satellites around it (Figma 02, 05). */
export function Orbit({ satellites, caption, showSelf = false, height = 190 }: OrbitProps) {
  const [width, setWidth] = useState(0);
  const cx = width / 2;
  const cy = height / 2 - (caption ? 10 : 0);
  const ellipses = {
    outer: { rx: width * 0.47, ry: height * 0.2 },
    inner: { rx: width * 0.32, ry: height * 0.3 },
  };

  const place = (slot: Slot) => {
    const { rx, ry } = ellipses[slot.orbit];
    const theta = (slot.angle * Math.PI) / 180;
    return { x: cx + rx * Math.cos(theta), y: cy + ry * Math.sin(theta) };
  };

  const dots = satellites.slice(0, slots.length).map((satellite, i) => ({
    ...satellite,
    slot: slots[i],
    ...place(slots[i]),
    color: colors.nebula as string,
  }));
  if (showSelf) {
    dots.push({ key: 'self', label: 'sen', slot: selfSlot, ...place(selfSlot), color: colors.moon });
  }

  return (
    <View
      style={{ height }}
      onLayout={(event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width)}
      accessible
      accessibilityLabel={[caption, ...satellites.map((s) => s.label)].filter(Boolean).join(', ')}>
      {width > 0 ? (
        <>
          <Svg width={width} height={height} style={{ position: 'absolute' }}>
            {(['outer', 'inner'] as const).map((orbit) => (
              <Ellipse
                key={orbit}
                cx={cx}
                cy={cy}
                rx={ellipses[orbit].rx}
                ry={ellipses[orbit].ry}
                stroke={colors.line}
                strokeWidth={1}
                fill="none"
              />
            ))}
            <Circle cx={cx} cy={cy} r={38} fill={colors.acid} opacity={0.16} />
            <Circle cx={cx} cy={cy} r={25} fill={colors.acid} />
            {dots.map((dot) => (
              <Circle key={dot.key} cx={dot.x} cy={dot.y} r={DOT / 2} fill={dot.color} />
            ))}
          </Svg>
          {dots.map((dot) => (
            <Txt
              key={dot.key}
              variant="small"
              color={dot.key === 'self' ? 'moon' : 'moonMid'}
              numberOfLines={1}
              style={labelPosition(dot.slot.label, dot.x, dot.y, width)}>
              {dot.label}
            </Txt>
          ))}
          {caption ? (
            <Txt
              variant="small"
              color="moonMid"
              style={{ position: 'absolute', bottom: 0, left: 0, right: 0, textAlign: 'center' }}>
              {caption}
            </Txt>
          ) : null}
        </>
      ) : null}
    </View>
  );
}

/**
 * A label next to its dot, kept inside the drawing: side labels are anchored at the dot and get the room up to
 * the edge; a centered label near an edge aligns to that edge.
 */
function labelPosition(side: Slot['label'], x: number, y: number, width: number) {
  const clamp = (left: number) => Math.max(0, Math.min(width - LABEL_WIDTH, left));
  switch (side) {
    case 'left':
      return { position: 'absolute' as const, textAlign: 'right' as const, right: width - x + DOT, maxWidth: x - DOT, top: y - 8 };
    case 'right':
      return { position: 'absolute' as const, left: x + DOT, maxWidth: width - x - DOT, top: y - 8 };
    case 'below': {
      const left = clamp(x - LABEL_WIDTH / 2);
      const textAlign = left === 0 ? ('left' as const) : left === width - LABEL_WIDTH ? ('right' as const) : ('center' as const);
      return { position: 'absolute' as const, width: LABEL_WIDTH, textAlign, left, top: y + DOT };
    }
  }
}
