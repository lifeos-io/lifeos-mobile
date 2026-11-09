import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';

import { useStartMission } from '@/api/hooks';
import { Button, Card, CheckIcon, Chips, PlusIcon, Screen, ScreenHeader, Txt } from '@/components';
import { errorMessage } from '@/lib/errors';
import { colors, layout, typography } from '@/theme';

/**
 * How long the mission runs: the goal's window starts today and ends this many months later (Strategy keeps every
 * phase inside it).
 */
const windows = [
  { label: '6 ay', months: 6 },
  { label: '6–12 ay', months: 12 },
  { label: '12+ ay', months: 18 },
] as const;

const TITLE_MAX = 200;
const CONSTRAINT_MAX = 500;

/**
 * Görev tanımı — onboarding (Figma 01): one destination, its window and the constraints the route must respect.
 * Starting creates the goal, records each constraint as a known fact of it, marks the profile onboarded and goes
 * on to drawing the route.
 */
export default function OnboardingScreen() {
  const start = useStartMission();
  const [title, setTitle] = useState('');
  const [window, setWindow] = useState(1);
  const [constraints, setConstraints] = useState<string[]>([]);
  const [newConstraint, setNewConstraint] = useState('');

  const addConstraint = () => {
    const text = newConstraint.trim();
    if (text && !constraints.includes(text)) setConstraints([...constraints, text]);
    setNewConstraint('');
  };

  const submit = () => {
    const chosen = windows[window];
    start.mutate(
      {
        goal: {
          title: title.trim(),
          domain: 'CAREER',
          whyItMatters: null,
          successDefinition: null,
          windowStart: monthsFromToday(0),
          windowEnd: monthsFromToday(chosen.months),
        },
        constraints,
      },
      // The goal has no route yet: drawing it is the next step.
      { onSuccess: () => router.replace('/route/edit') },
    );
  };

  return (
    <Screen
      footer={<Button label="Görevi başlat" disabled={!title.trim() || !start.isIdle} onPress={submit} />}>
      <ScreenHeader
        back
        overline="Görev tanımı"
        title="12 ay sonra ne değişmiş olsun?"
        subtitle="Tek bir varış noktası seç. Diğer hedefler uydu olarak yörüngede bekleyebilir."
      />

      <Card border="acid" style={{ gap: 6 }}>
        <Txt variant="small" color="moonMid">
          Varış noktası
        </Txt>
        <TextInput
          value={title}
          onChangeText={setTitle}
          maxLength={TITLE_MAX}
          multiline
          placeholder="Outsource'tan in-house yazılım geliştiriciliğe geçmek"
          placeholderTextColor={colors.moonFaint}
          selectionColor={colors.acid}
          accessibilityLabel="Varış noktası"
          style={[typography.cardTitle, { color: colors.moon, padding: 0 }]}
        />
      </Card>

      <View style={{ gap: 10 }}>
        <Txt variant="overline" color="moonMid">
          Zaman penceresi
        </Txt>
        <Chips
          label="Zaman penceresi"
          options={windows.map((option, i) => ({ value: i, label: option.label }))}
          value={window}
          onChange={setWindow}
        />
      </View>

      <View style={{ gap: 8 }}>
        <Txt variant="overline" color="moonMid">
          Kısıtlar
        </Txt>
        {constraints.map((constraint) => (
          <Pressable
            key={constraint}
            onPress={() => setConstraints(constraints.filter((c) => c !== constraint))}
            accessibilityRole="button"
            accessibilityHint="Kısıtı kaldırır"
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              backgroundColor: colors.cabin,
              borderRadius: layout.cardRadius,
              paddingVertical: 14,
              paddingHorizontal: layout.cardPadding,
            }}>
            <CheckIcon size={16} color="acid" />
            <Txt style={{ flex: 1 }}>{constraint}</Txt>
          </Pressable>
        ))}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 4 }}>
          <PlusIcon size={16} color="moonMid" />
          <TextInput
            value={newConstraint}
            onChangeText={setNewConstraint}
            onSubmitEditing={addConstraint}
            onBlur={addConstraint}
            maxLength={CONSTRAINT_MAX}
            returnKeyType="done"
            placeholder="Kısıt ekle"
            placeholderTextColor={colors.moonMid}
            selectionColor={colors.acid}
            accessibilityLabel="Kısıt ekle"
            style={[typography.small, { flex: 1, color: colors.moon, paddingVertical: 8 }]}
          />
        </View>
      </View>

      <Card border="nebula" fill="nebulaInk" style={{ gap: 4 }}>
        <Txt variant="small" color="nebula">
          Kule
        </Txt>
        <Txt variant="small">
          Bu pencere senin hedefin, işverenin taahhüdü değil. Kontrolünün dışındaki koşulları ayrıca izleyeceğim.
        </Txt>
      </Card>

      {start.isError ? (
        <Txt variant="small" color="signal">
          {errorMessage(start.error)}
        </Txt>
      ) : null}
    </Screen>
  );
}

/** Today plus `months`, as a LocalDate. */
function monthsFromToday(months: number): string {
  const date = new Date();
  date.setMonth(date.getMonth() + months);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}
