import { Link, useLocalSearchParams } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import {
  useActions,
  useActivateWeek,
  useCreateWeeklyPlan,
  useCurrentStrategy,
  useDeleteAction,
  useMainGoal,
  useProfile,
  useUpdateWeeklyPlan,
  useWeeklyPlans,
} from '@/api/hooks';
import type { Action, Goal, Phase, StrategyVersion, WeeklyPlan } from '@/api/types';
import {
  Button,
  Card,
  Field,
  LoadError,
  Loading,
  PlusIcon,
  ProgressBar,
  Screen,
  ScreenHeader,
  Stepper,
  Txt,
} from '@/components';
import { errorMessage } from '@/lib/errors';
import { clock, dayMonth, duration, today } from '@/lib/format';
import { backToMission } from '@/lib/navigation';
import { addDays } from '@/lib/route';
import { actionKindLabels } from '@/lib/strategy';
import { mondayOf, plannedMinutes, weekNumber, weekToPlan } from '@/lib/week';

const FUEL_STEP = 30;
/** A week's capacity tops out at a full-time job's worth of extra hours. */
const FUEL_MAX = 40 * 60;
const HEADLINE_MAX = 200;

/**
 * Haftanın itkisi — planning a week: its fuel (capacity), its steps, then "İtkiyi ateşle" makes it the active week.
 * `isoWeek` picks the week (default: this week, or the next one once this one is closed); `headline` carries the
 * focus written in the weekly review.
 */
export default function WeekScreen() {
  const params = useLocalSearchParams<{ isoWeek?: string; headline?: string }>();
  const plans = useWeeklyPlans();
  const goal = useMainGoal();
  const strategy = useCurrentStrategy(goal.data?.id);
  const profile = useProfile();

  const failed = [plans, goal, profile].find((query) => query.isError);
  if (failed || !plans.data || goal.isPending || !profile.data) {
    return (
      <Screen>
        <ScreenHeader back overline="Haftanın itkisi" title="" />
        {failed ? <LoadError onRetry={() => failed.refetch()} /> : <Loading />}
      </Screen>
    );
  }
  if (!goal.data) {
    return (
      <Screen>
        <ScreenHeader back overline="Haftanın itkisi" title="Önce görevini tanımla" />
      </Screen>
    );
  }

  const isoWeek = params.isoWeek ?? weekToPlan(plans.data, today()).isoWeek;
  const plan = plans.data.find((p) => p.isoWeek === isoWeek) ?? null;
  const weekStart = plan?.weekStart ?? mondayOf(isoWeek);
  const header = (
    <ScreenHeader
      back
      overline={`Hafta ${weekNumber(isoWeek)} · ${dayMonth(weekStart)} – ${dayMonth(addDays(weekStart, 6))}`}
      title="Haftanın itkisi"
      subtitle={
        plan?.status === 'ACTIVE' || plan?.status === 'CLOSED'
          ? undefined
          : 'Yakıtını seç, adımlarını koy, sonra itkiyi ateşle.'
      }
    />
  );

  if (!plan) {
    return (
      <NewWeek
        header={header}
        isoWeek={isoWeek}
        goal={goal.data}
        defaultMinutes={profile.data.defaultWeeklyMinutes}
        headline={params.headline ?? ''}
      />
    );
  }
  if (plan.status !== 'DRAFT') {
    return (
      <Screen footer={<Button label="Göreve dön" onPress={() => backToMission()} />}>
        {header}
        <Card>
          <Txt variant="bodyStrong">
            {plan.status === 'ACTIVE' ? 'Bu hafta zaten ateşlendi.' : 'Bu hafta kapandı.'}
          </Txt>
          <Txt variant="small" color="moonMid" style={{ marginTop: 4 }}>
            {plan.status === 'ACTIVE'
              ? 'Adımlarını Görev ekranında işaretle; yeni adımı oradan ekle.'
              : 'Yer kontrolü yapıldı; gelecek haftayı planla.'}
          </Txt>
        </Card>
      </Screen>
    );
  }
  return <DraftWeek header={header} plan={plan} goal={goal.data} strategy={strategy.data ?? null} />;
}

/** No plan yet: the week's fuel and focus, then the draft opens. */
function NewWeek({
  header,
  isoWeek,
  goal,
  defaultMinutes,
  headline: initialHeadline,
}: {
  header: ReactNode;
  isoWeek: string;
  goal: Goal;
  defaultMinutes: number;
  headline: string;
}) {
  const create = useCreateWeeklyPlan();
  const [capacity, setCapacity] = useState(defaultMinutes);
  const [headline, setHeadline] = useState(initialHeadline);

  const submit = () =>
    create.mutate({
      isoWeek,
      capacityMinutes: capacity,
      headline: headline.trim() || null,
      // One destination: all of the week's fuel goes to it.
      allocations: [{ goalId: goal.id, allocatedMinutes: capacity }],
    });

  return (
    <Screen footer={<Button label="Adımları seç" disabled={capacity <= 0 || !create.isIdle} onPress={submit} />}>
      {header}
      <FuelCard capacity={capacity} planned={0} onStep={(delta) => setCapacity(nextFuel(capacity, delta))} />
      <Field
        label="Haftanın odağı (isteğe bağlı)"
        value={headline}
        onChangeText={setHeadline}
        maxLength={HEADLINE_MAX}
        placeholder="İşine odaklan, beklentiyi netleştir, dinlen."
      />
      {create.isError ? (
        <Txt variant="small" color="signal">
          {errorMessage(create.error)}
        </Txt>
      ) : null}
    </Screen>
  );
}

/** A draft week: fuel, steps (removable), and the launch. */
function DraftWeek({
  header,
  plan,
  goal,
  strategy,
}: {
  header: ReactNode;
  plan: WeeklyPlan;
  goal: Goal;
  strategy: StrategyVersion | null;
}) {
  const actions = useActions(plan.isoWeek);
  const update = useUpdateWeeklyPlan(plan.isoWeek);
  const remove = useDeleteAction(plan.isoWeek);
  const activate = useActivateWeek(plan.isoWeek);
  const steps = actions.data ?? [];
  const planned = plannedMinutes(steps);

  const setFuel = (delta: -1 | 1) => {
    const capacity = nextFuel(plan.capacityMinutes, delta);
    update.mutate({
      version: plan.version,
      capacityMinutes: capacity,
      allocations: [{ goalId: goal.id, allocatedMinutes: capacity }],
    });
  };

  const launch = () => activate.mutate(undefined, { onSuccess: () => backToMission() });
  const error = [update, remove, activate].find((m) => m.isError)?.error;

  return (
    <Screen
      footer={
        <Button
          label="İtkiyi ateşle"
          disabled={steps.length === 0 || planned > plan.capacityMinutes || !activate.isIdle}
          onPress={launch}
        />
      }>
      {header}
      {plan.headline ? (
        <Card fill="acid" style={{ gap: 4 }}>
          <Txt variant="overline" color="acidInk">
            Haftanın odağı
          </Txt>
          <Txt variant="cardTitle" color="acidInk">
            {plan.headline}
          </Txt>
        </Card>
      ) : null}
      <FuelCard
        capacity={plan.capacityMinutes}
        planned={planned}
        onStep={setFuel}
        busy={update.isPending}
      />

      <View style={{ gap: 10 }}>
        <Txt variant="overline" color="moonMid">
          {steps.length ? `Rotadaki ${steps.length} adım` : 'Adımlar'}
        </Txt>
        {actions.isPending ? <Loading /> : null}
        {steps.map((action) => (
          <StepCard
            key={action.id}
            action={action}
            phase={strategy?.phases.find((p) => p.phaseKey === action.phaseKey)}
            onRemove={() => remove.mutate(action.id)}
          />
        ))}
        <Link href={{ pathname: '/week/step', params: { isoWeek: plan.isoWeek } }} asChild>
          <Pressable
            accessibilityRole="button"
            style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, paddingHorizontal: 4 }}>
            <PlusIcon size={16} color="acid" />
            <Txt color="acid">Adım ekle</Txt>
          </Pressable>
        </Link>
      </View>

      {error ? (
        <Txt variant="small" color="signal">
          {errorMessage(error)}
        </Txt>
      ) : null}
    </Screen>
  );
}

/** "Yakıt 3:50 / 4 sa": the week's capacity, stepped in half hours, with what the steps already take. */
function FuelCard({
  capacity,
  planned,
  onStep,
  busy = false,
}: {
  capacity: number;
  planned: number;
  onStep: (delta: -1 | 1) => void;
  busy?: boolean;
}) {
  const over = planned > capacity;
  return (
    <Card style={{ gap: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ gap: 2 }}>
          <Txt variant="overline" color="moonMid">
            Yakıt
          </Txt>
          <Txt variant="small" color={over ? 'signal' : 'moonMid'}>
            Planlanan {clock(planned)} / {clock(capacity)} sa
          </Txt>
        </View>
        <Stepper
          label="Haftalık yakıt"
          value={duration(capacity)}
          onStep={onStep}
          canDecrease={!busy && capacity > FUEL_STEP && capacity - FUEL_STEP >= planned}
          canIncrease={!busy && capacity < FUEL_MAX}
        />
      </View>
      <ProgressBar value={capacity ? Math.min(1, planned / capacity) : 0} color={over ? 'signal' : 'acid'} />
    </Card>
  );
}

function StepCard({ action, phase, onRemove }: { action: Action; phase?: Phase; onRemove: () => void }) {
  const meta = [
    duration(action.estimateMinutes),
    actionKindLabels[action.kind],
    phase ? `Aşama ${phase.ordinal}` : null,
    action.expectedEvidence ? 'telemetri üretir' : null,
  ]
    .filter(Boolean)
    .join(' · ');
  return (
    <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <View style={{ flex: 1, gap: 2 }}>
        <Txt variant="cardTitle">{action.title}</Txt>
        <Txt variant="small" color="moonMid">
          {meta}
        </Txt>
      </View>
      <Pressable onPress={onRemove} hitSlop={8} accessibilityRole="button" accessibilityLabel={`${action.title}: kaldır`}>
        <Txt variant="small" color="signal">
          Kaldır
        </Txt>
      </Pressable>
    </Card>
  );
}

function nextFuel(capacity: number, delta: -1 | 1): number {
  return Math.min(FUEL_MAX, Math.max(FUEL_STEP, capacity + delta * FUEL_STEP));
}
