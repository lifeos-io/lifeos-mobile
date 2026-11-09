import { Pressable, StyleSheet, View } from 'react-native';

import type { Action } from '@/api/types';
import { duration } from '@/lib/format';
import { colors, layout } from '@/theme';

import { CheckIcon } from './icons';
import { Txt } from './Txt';

type ActionRowProps = {
  action: Action;
  /** The step to do next: drawn on acid. */
  focused?: boolean;
  onPress?: () => void;
  onLongPress?: () => void;
};

/**
 * One step of the week (Figma 02): dot, title, "estimate · why". A done step shows a check; a deferred one is
 * dimmed and says so.
 */
export function ActionRow({ action, focused = false, onPress, onLongPress }: ActionRowProps) {
  const done = action.status === 'DONE';
  const deferred = action.status === 'DEFERRED';
  const meta = [deferred ? 'ertelendi' : null, duration(action.estimateMinutes), action.why]
    .filter(Boolean)
    .join(' · ');
  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: done }}
      accessibilityLabel={`${action.title}, ${meta}`}
      accessibilityHint={
        (done ? 'Yeniden planlanmış olarak işaretler' : 'Tamamlandı olarak işaretler') +
        (onLongPress && !done ? '; uzun bas: ertele ya da bırak' : '')
      }
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: focused ? colors.acid : colors.cabin, opacity: pressed ? 0.85 : deferred ? 0.55 : 1 },
      ]}>
      <View style={styles.marker}>
        {done ? (
          <CheckIcon size={16} color="acid" />
        ) : (
          <View style={[styles.dot, { backgroundColor: focused ? colors.acidInk : colors.acid }]} />
        )}
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Txt
          variant="cardTitle"
          color={focused ? 'acidInk' : done ? 'moonMid' : 'moon'}
          style={done ? { textDecorationLine: 'line-through' } : undefined}>
          {action.title}
        </Txt>
        <Txt variant="small" color={focused ? 'acidInk' : 'moonMid'} style={focused ? { opacity: 0.75 } : undefined}>
          {meta}
        </Txt>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: layout.cardRadius,
    paddingVertical: 14,
    paddingHorizontal: layout.cardPadding,
  },
  marker: { width: 16, alignItems: 'center' },
  dot: { width: 8, height: 8, borderRadius: 4 },
});
