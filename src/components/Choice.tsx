import { Pressable, View } from 'react-native';

import { colors, layout } from '@/theme';

import { CheckIcon } from './icons';
import { Txt } from './Txt';

/** Pills to pick one of a few options ("6 AY", "BİLİNMEYEN"…); the selected one in asit. */
export function Chips<T extends string | number>({
  options,
  value,
  onChange,
  label,
}: {
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  /** For screen readers: what is being chosen. */
  label: string;
}) {
  return (
    <View
      style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}
      accessibilityRole="radiogroup"
      accessibilityLabel={label}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={String(option.value)}
            onPress={() => onChange(option.value)}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            style={{
              paddingHorizontal: 14,
              paddingVertical: 8,
              borderRadius: 999,
              borderWidth: 1,
              borderColor: selected ? colors.acid : colors.line,
              backgroundColor: selected ? colors.acid : 'transparent',
            }}>
            <Txt variant="micro" color={selected ? 'acidInk' : 'moonMid'}>
              {option.label.toLocaleUpperCase('tr-TR')}
            </Txt>
          </Pressable>
        );
      })}
    </View>
  );
}

/** A checkbox row: "Kontrolümün dışında". */
export function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (value: boolean) => void }) {
  return (
    <Pressable
      onPress={() => onChange(!value)}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: value }}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 6 }}>
      <View
        style={{
          width: 22,
          height: 22,
          borderRadius: 6,
          borderWidth: 1.5,
          borderColor: value ? colors.acid : colors.moonFaint,
          backgroundColor: value ? colors.acid : 'transparent',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        {value ? <CheckIcon size={14} color="acidInk" /> : null}
      </View>
      <Txt style={{ flex: 1 }}>{label}</Txt>
    </Pressable>
  );
}

/** "‹ 15 Ara 2026 ›": steps a value one unit at a time. */
export function Stepper({
  value,
  onStep,
  canDecrease = true,
  canIncrease = true,
  label,
}: {
  value: string;
  onStep: (delta: -1 | 1) => void;
  canDecrease?: boolean;
  canIncrease?: boolean;
  /** For screen readers: what the value is. */
  label: string;
}) {
  const button = (delta: -1 | 1, enabled: boolean) => (
    <Pressable
      onPress={() => onStep(delta)}
      disabled={!enabled}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${delta < 0 ? 'azalt' : 'artır'}`}
      accessibilityState={{ disabled: !enabled }}
      style={{
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: colors.cabinRaised,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: enabled ? 1 : 0.35,
      }}>
      <Txt variant="bodyStrong">{delta < 0 ? '−' : '+'}</Txt>
    </Pressable>
  );
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      {button(-1, canDecrease)}
      <Txt variant="counter" style={{ minWidth: 92, textAlign: 'center' }} accessibilityLabel={`${label}: ${value}`}>
        {value}
      </Txt>
      {button(1, canIncrease)}
    </View>
  );
}

/**
 * A card to pick one of a few records (a step, a piece of evidence, a feedback); tapping the picked one again
 * unpicks it, so the link stays optional.
 */
export function PickRow({
  title,
  meta,
  selected,
  onPress,
}: {
  title: string;
  meta?: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: colors.cabin,
        borderRadius: layout.cardRadius,
        borderWidth: 1,
        borderColor: selected ? colors.acid : colors.line,
        paddingVertical: 12,
        paddingHorizontal: 14,
      }}>
      <View style={{ flex: 1, gap: 2 }}>
        <Txt variant="bodyStrong" numberOfLines={2}>
          {title}
        </Txt>
        {meta ? (
          <Txt variant="small" color="moonMid" numberOfLines={1}>
            {meta}
          </Txt>
        ) : null}
      </View>
      {selected ? <CheckIcon size={16} color="acid" /> : null}
    </Pressable>
  );
}
