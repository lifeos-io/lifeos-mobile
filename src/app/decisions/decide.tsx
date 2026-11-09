import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { useChangeDecision, useDecision } from '@/api/hooks';
import type { Decision, LocalDate } from '@/api/types';
import { Button, Card, Field, LoadError, Loading, Screen, ScreenHeader, Stepper, Txt } from '@/components';
import { draftOf } from '@/lib/decision';
import { errorMessage } from '@/lib/errors';
import { dayMonth, today } from '@/lib/format';
import { goBack } from '@/lib/navigation';
import { addDays } from '@/lib/route';
import { colors, layout } from '@/theme';

const REASON_MAX = 1000;
const OUTCOME_MAX = 2000;

/**
 * Karar ver — a draft becomes an OPEN decision: the option chosen, why each other one is not, the measurable
 * outcome expected and the day it is looked at again (Figma 07's record, written).
 */
export default function DecideScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const decision = useDecision(id);
  if (decision.isError || decision.isPending) {
    return (
      <Screen>
        <ScreenHeader back accent="moonMid" overline="Karar ver" title="" />
        {decision.isError ? <LoadError onRetry={() => decision.refetch()} /> : <Loading />}
      </Screen>
    );
  }
  return <Decide decision={decision.data} />;
}

function Decide({ decision }: { decision: Decision }) {
  const { decide } = useChangeDecision(decision.id);
  const tomorrow = addDays(today(), 1);
  const [chosen, setChosen] = useState<string | null>(null);
  const [reasons, setReasons] = useState<Record<string, string>>(() =>
    Object.fromEntries(decision.alternatives.map((a) => [a.label, a.rejectionReason ?? ''])),
  );
  const [outcome, setOutcome] = useState('');
  const [reviewOn, setReviewOn] = useState<LocalDate>(addDays(today(), 21));

  const others = decision.alternatives.filter((a) => a.label !== chosen);
  const ready = !!chosen && !!outcome.trim() && others.every((a) => reasons[a.label]?.trim()) && decide.isIdle;
  const reasonsChanged = decision.alternatives.some(
    (a) => (reasons[a.label]?.trim() || null) !== (a.rejectionReason?.trim() || null),
  );

  const submit = () => {
    if (!chosen) return;
    const draft = draftOf(decision);
    decide.mutate(
      {
        draft: reasonsChanged
          ? {
              ...draft,
              alternatives: draft.alternatives.map((a, i) => ({
                ...a,
                rejectionReason: reasons[decision.alternatives[i].label]?.trim() || null,
              })),
              version: decision.version,
            }
          : undefined,
        decide: { version: decision.version, chosenLabel: chosen, expectedOutcome: outcome.trim(), reviewOn },
      },
      { onSuccess: () => goBack() },
    );
  };

  // Deciding refetches the decision as OPEN; the form stays until the screen closes itself.
  if (decision.status !== 'DRAFT' && decide.isIdle) {
    return (
      <Screen>
        <ScreenHeader back accent="moonMid" overline="Karar ver" title="Bu manevraya zaten karar verildi" />
      </Screen>
    );
  }

  return (
    <Screen footer={<Button label="Karar ver" disabled={!ready} onPress={submit} />}>
      <ScreenHeader
        back
        accent="moonMid"
        overline="Manevra kaydı · karar"
        title={decision.title}
        subtitle="Birini seç; diğerlerinin neden elendiğini yaz."
      />

      <View style={{ gap: 10 }} accessibilityRole="radiogroup" accessibilityLabel="Seçilen manevra">
        {decision.alternatives.map((alternative) => {
          const selected = alternative.label === chosen;
          return (
            <View key={alternative.label} style={{ gap: 8 }}>
              <Pressable
                onPress={() => setChosen(alternative.label)}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                style={{
                  backgroundColor: colors.cabin,
                  borderRadius: layout.cardRadius,
                  borderWidth: 1,
                  borderColor: selected ? colors.acid : colors.line,
                  padding: layout.cardPadding,
                  gap: 4,
                }}>
                <Txt variant="bodyStrong">
                  {alternative.label} · {alternative.description}
                </Txt>
                <Txt variant="small" color={selected ? 'acid' : 'moonMid'}>
                  {selected ? 'Seçildi' : chosen ? 'Elendi' : 'Seçmek için dokun'}
                </Txt>
              </Pressable>
              {chosen && !selected ? (
                <Field
                  label={`${alternative.label} neden elendi?`}
                  value={reasons[alternative.label] ?? ''}
                  onChangeText={(text) => setReasons((r) => ({ ...r, [alternative.label]: text }))}
                  maxLength={REASON_MAX}
                  invalid={!reasons[alternative.label]?.trim()}
                  placeholder="İhtiyaç doğrulanmadı"
                />
              ) : null}
            </View>
          );
        })}
      </View>

      <Field
        label="Beklenen sonuç · ölçülebilir"
        value={outcome}
        onChangeText={setOutcome}
        maxLength={OUTCOME_MAX}
        multiline
        placeholder="29 Kasım'a kadar rıza akışını kendi kodumuzda bulup açıklayabilmek"
      />

      <Card style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Txt variant="overline" color="moonMid">
          Değerlendirme
        </Txt>
        <Stepper
          label="Değerlendirme tarihi"
          value={`${dayMonth(reviewOn)} ${reviewOn.slice(0, 4)}`}
          onStep={(delta) => setReviewOn((d) => (addDays(d, delta * 7) < tomorrow ? tomorrow : addDays(d, delta * 7)))}
          canDecrease={reviewOn > tomorrow}
        />
      </Card>

      {decide.isError ? (
        <Txt variant="small" color="signal">
          {errorMessage(decide.error)}
        </Txt>
      ) : null}
    </Screen>
  );
}
