import { View } from 'react-native';

import type { EffortAllocation, EffortCategory } from '@/api/types';
import { effortLabels } from '@/lib/format';
import { colors, type ColorToken } from '@/theme';

import { Txt } from './Txt';

export const effortColors: Record<EffortCategory, ColorToken> = {
  TECHNICAL: 'nebula',
  DOMAIN: 'acid',
  OTHER: 'cabinRaised',
};

const order: EffortCategory[] = ['TECHNICAL', 'DOMAIN', 'OTHER'];

/** A strategy version's weekly effort split as one stacked bar, labelled "v2" (Figma 04). */
export function EffortBar({ label, allocation, highlight }: { label: string; allocation: EffortAllocation; highlight?: boolean }) {
  const total = order.reduce((sum, category) => sum + allocation[category], 0) || 1;
  return (
    <View
      style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}
      accessible
      accessibilityLabel={`${label}: ${order.map((c) => `${effortLabels[c]} yüzde ${allocation[c]}`).join(', ')}`}>
      <Txt variant="displayM" color={highlight ? 'acid' : 'moon'} style={{ width: 28 }}>
        {label}
      </Txt>
      <View style={{ flex: 1, flexDirection: 'row', gap: 3, height: 10 }}>
        {order.map((category) =>
          allocation[category] > 0 ? (
            <View
              key={category}
              style={{
                flex: allocation[category] / total,
                borderRadius: 5,
                backgroundColor: colors[effortColors[category]],
              }}
            />
          ) : null,
        )}
      </View>
    </View>
  );
}

/** The legend under effort bars. */
export function EffortLegend() {
  return (
    <View style={{ flexDirection: 'row', gap: 16 }}>
      {order.map((category) => (
        <View key={category} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: colors[category === 'OTHER' ? 'moonFaint' : effortColors[category]],
            }}
          />
          <Txt variant="small" color="moonMid">
            {effortLabels[category]}
          </Txt>
        </View>
      ))}
    </View>
  );
}
