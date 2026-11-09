import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { useActions, useCreateAction, useCurrentStrategy, useMainGoal, useWeeklyPlans } from '@/api/hooks';
import type { ActionKind, Uuid } from '@/api/types';
import { Button, Card, Chips, Field, Screen, ScreenHeader, Stepper, Txt } from '@/components';
import { errorMessage } from '@/lib/errors';
import { clock, duration } from '@/lib/format';
import { goBack } from '@/lib/navigation';
import { actionKindLabels, activePhase } from '@/lib/strategy';
import { plannedMinutes, weekNumber } from '@/lib/week';

const TITLE_MAX = 200;
const TEXT_MAX = 1000;
const ESTIMATE_STEP = 15;
const ESTIMATE_MAX = 10 * 60;

const kinds = (Object.keys(actionKindLabels) as ActionKind[]).map((kind) => ({
  value: kind,
  label: actionKindLabels[kind],
}));

/**
 * A new step of a week (draft or active): what, how long, what kind, which phase it serves and what telemetry it
 * should leave behind. Strategy refuses it when the week's fuel would not cover it.
 */
export default function NewStepScreen() {
  const { isoWeek } = useLocalSearchParams<{ isoWeek: string }>();
  const goal = useMainGoal();
  const strategy = useCurrentStrategy(goal.data?.id);
  const plans = useWeeklyPlans();
  const actions = useActions(isoWeek);
  const create = useCreateAction(isoWeek);

  const phases = strategy.data?.phases ?? [];
  const [title, setTitle] = useState('');
  const [estimate, setEstimate] = useState(60);
  const [kind, setKind] = useState<ActionKind>('TECHNICAL');
  // Null until the user picks one: the phase being worked on is the default.
  const [phaseKey, setPhaseKey] = useState<Uuid | null>(null);
  const [expectedEvidence, setExpectedEvidence] = useState('');
  const [why, setWhy] = useState('');

  const plan = plans.data?.find((p) => p.isoWeek === isoWeek);
  const left = plan ? plan.capacityMinutes - plannedMinutes(actions.data ?? []) : undefined;
  const chosenPhase = phaseKey ?? activePhase(strategy.data)?.phaseKey ?? null;
  const tooLong = left !== undefined && estimate > left;

  const submit = () =>
    create.mutate(
      {
        title: title.trim(),
        why: why.trim() || null,
        expectedEvidence: expectedEvidence.trim() || null,
        kind,
        estimateMinutes: estimate,
        goalIds: [goal.data!.id],
        phaseKey: chosenPhase,
      },
      { onSuccess: () => goBack('/') },
    );

  return (
    <Screen
      footer={
        <Button
          label="Adımı ekle"
          disabled={!goal.data || !plan || !title.trim() || tooLong || !create.isIdle}
          onPress={submit}
        />
      }>
      <ScreenHeader
        back
        overline={`Hafta ${weekNumber(isoWeek)} · yeni adım`}
        title="Bu hafta ne yapacaksın?"
        subtitle="Küçük, bitirilebilir, bir hafta içinde."
      />
      <Field
        label="Adım"
        value={title}
        onChangeText={setTitle}
        maxLength={TITLE_MAX}
        autoFocus
        placeholder="Kredi akışını çiz, doğrulat"
      />

      <Card style={{ gap: 6 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Txt variant="overline" color="moonMid">
            Süre
          </Txt>
          <Stepper
            label="Süre"
            value={duration(estimate)}
            onStep={(delta) =>
              setEstimate((e) => Math.min(ESTIMATE_MAX, Math.max(ESTIMATE_STEP, e + delta * ESTIMATE_STEP)))
            }
            canDecrease={estimate > ESTIMATE_STEP}
            canIncrease={estimate < ESTIMATE_MAX}
          />
        </View>
        {left !== undefined ? (
          <Txt variant="small" color={tooLong ? 'signal' : 'moonFaint'}>
            {tooLong
              ? `Kalan yakıt ${clock(Math.max(0, left))} sa; ya süreyi kısalt ya da haftanın yakıtını artır.`
              : `Kalan yakıt ${clock(left)} sa`}
          </Txt>
        ) : null}
      </Card>

      <View style={{ gap: 10 }}>
        <Txt variant="overline" color="moonMid">
          Tür
        </Txt>
        <Chips label="Tür" options={kinds} value={kind} onChange={setKind} />
      </View>

      {phases.length > 0 && chosenPhase ? (
        <View style={{ gap: 10 }}>
          <Txt variant="overline" color="moonMid">
            Hangi aşamaya hizmet ediyor?
          </Txt>
          <Chips
            label="Aşama"
            options={phases.map((p) => ({ value: p.phaseKey, label: `${p.ordinal} · ${p.title}` }))}
            value={chosenPhase}
            onChange={setPhaseKey}
          />
        </View>
      ) : null}

      <Field
        label="Ne telemetri üretir? (isteğe bağlı)"
        value={expectedEvidence}
        onChangeText={setExpectedEvidence}
        maxLength={TEXT_MAX}
        multiline
        placeholder="Ekibin doğruladığı bir akış diyagramı"
      />
      <Field
        label="Neden şimdi? (isteğe bağlı)"
        value={why}
        onChangeText={setWhy}
        maxLength={TEXT_MAX}
        placeholder="bir manevra bu veriyi bekliyor"
        note="Görev ekranında adımın altında görünür."
      />

      {create.isError ? (
        <Txt variant="small" color="signal">
          {errorMessage(create.error)}
        </Txt>
      ) : null}
    </Screen>
  );
}
