import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { useCreateStrategyVersion, useCurrentStrategy, useMainGoal } from '@/api/hooks';
import type { EffortAllocation, EffortCategory, Goal, LocalDate, StrategyVersion, Uuid } from '@/api/types';
import {
  Button,
  Card,
  EffortBar,
  Field,
  LoadError,
  Loading,
  Pill,
  PlusIcon,
  Screen,
  ScreenHeader,
  Stepper,
  Txt,
  type PillTone,
} from '@/components';
import { errorMessage } from '@/lib/errors';
import { dayMonth, effortLabels, longMonthRange, today } from '@/lib/format';
import { goBack } from '@/lib/navigation';
import {
  addDays,
  addMonths,
  clausesToLines,
  linesToClauses,
  maxDate,
  minDate,
  phaseStarts,
  phaseStatus,
} from '@/lib/route';

const SUMMARY_MAX = 2000;
const TITLE_MAX = 200;
const EXIT_MAX = 2000;
const REASON_MAX = 2000;
const MAX_PHASES = 12;
const EFFORT_STEP = 10;
const categories: EffortCategory[] = ['TECHNICAL', 'DOMAIN', 'OTHER'];

type DraftPhase = {
  /** React key: stable while the list changes. */
  key: string;
  /** Set for a phase carried over from the current version, so its steps and telemetry stay linked. */
  phaseKey: Uuid | null;
  title: string;
  endsOn: LocalDate;
  /** One exit clause per line. */
  exit: string;
};

const statusPills = {
  DONE: { label: 'Tamam', tone: 'muted' },
  ACTIVE: { label: 'Şimdi', tone: 'acid' },
  UPCOMING: { label: 'Sırada', tone: 'ghost' },
} as const satisfies Record<string, { label: string; tone: PillTone }>;

/**
 * Rotayı çiz / düzelt: the goal's phases, what each must prove and how the week's fuel splits. Saving writes a new
 * strategy version (the first one, or v(n+1) with a reason); phases follow each other, so each is set by its end.
 */
export default function RouteEditScreen() {
  const goal = useMainGoal();
  const strategy = useCurrentStrategy(goal.data?.id);

  const failed = [goal, strategy].find((query) => query.isError);
  if (failed || goal.isPending || (goal.data && strategy.isPending)) {
    return (
      <Screen>
        <ScreenHeader back fallback="/route" overline="Rota" title="" />
        {failed ? <LoadError onRetry={() => failed.refetch()} /> : <Loading />}
      </Screen>
    );
  }
  if (!goal.data) {
    return (
      <Screen>
        <ScreenHeader back fallback="/route" overline="Rota" title="Önce görevini tanımla" />
      </Screen>
    );
  }
  return <RouteEditor goal={goal.data} current={strategy.data ?? null} />;
}

let nextKey = 0;
const newKey = () => `new-${nextKey++}`;

function RouteEditor({ goal, current }: { goal: Goal; current: StrategyVersion | null }) {
  const save = useCreateStrategyVersion(goal.id);
  const routeStart = maxDate(current?.phases[0]?.startsOn ?? goal.windowStart, goal.windowStart);

  const [summary, setSummary] = useState(current?.summary ?? '');
  const [reason, setReason] = useState('');
  const [effort, setEffort] = useState<EffortAllocation>(
    current?.effortAllocation ?? { TECHNICAL: 60, DOMAIN: 30, OTHER: 10 },
  );
  const [phases, setPhases] = useState<DraftPhase[]>(() =>
    current
      ? current.phases.map((phase) => ({
          key: phase.phaseKey,
          phaseKey: phase.phaseKey,
          title: phase.title,
          endsOn: minDate(phase.endsOn, goal.windowEnd),
          exit: clausesToLines(phase.exitCriteria),
        }))
      : [{ key: newKey(), phaseKey: null, title: '', endsOn: defaultEnd(routeStart, goal.windowEnd), exit: '' }],
  );

  const starts = phaseStarts(
    routeStart,
    phases.map((phase) => phase.endsOn),
  );
  const nextStart = phases.length ? addDays(phases[phases.length - 1].endsOn, 1) : routeStart;
  const canAdd = phases.length < MAX_PHASES && nextStart <= goal.windowEnd;
  const effortTotal = categories.reduce((sum, category) => sum + effort[category], 0);
  const revising = current !== null;
  const now = today();

  const problems = [
    !summary.trim() && 'özet',
    phases.some((phase) => !phase.title.trim()) && 'aşama adı',
    phases.some((phase, i) => phase.endsOn < starts[i]) && 'aşama tarihleri',
    effortTotal !== 100 && 'yakıt dağılımı',
    revising && !reason.trim() && 'değişiklik nedeni',
  ].filter(Boolean);

  const update = (key: string, changes: Partial<DraftPhase>) =>
    setPhases((list) => list.map((phase) => (phase.key === key ? { ...phase, ...changes } : phase)));

  const submit = () =>
    save.mutate(
      {
        expectedCurrentVersionNo: current?.versionNo ?? null,
        summary: summary.trim(),
        changeReason: revising ? reason.trim() : null,
        phases: phases.map((phase, i) => ({
          phaseKey: phase.phaseKey,
          title: phase.title.trim(),
          startsOn: starts[i],
          endsOn: phase.endsOn,
          exitCriteria: linesToClauses(phase.exit),
          status: phaseStatus(starts[i], phase.endsOn, now),
        })),
        effortAllocation: effort,
      },
      { onSuccess: () => goBack('/route') },
    );

  return (
    <Screen
      footer={
        <View style={{ gap: 8 }}>
          {problems.length > 0 ? (
            <Txt variant="small" color="moonMid" style={{ textAlign: 'center' }}>
              Eksik: {problems.join(', ')}
            </Txt>
          ) : null}
          <Button
            label={revising ? `v${current.versionNo + 1} olarak kaydet` : 'Rotayı başlat'}
            disabled={problems.length > 0 || !save.isIdle}
            onPress={submit}
          />
        </View>
      }>
      <ScreenHeader
        back
        fallback="/route"
        overline={revising ? `Rota düzeltmesi · v${current.versionNo} → v${current.versionNo + 1}` : 'İlk rota'}
        title={revising ? 'Rotayı düzelt' : 'Varışa giden aşamalar'}
        subtitle={`${goal.title} · pencere: ${longMonthRange(goal.windowStart, goal.windowEnd)}`}
      />

      <Field
        label="Rotanın özü"
        value={summary}
        onChangeText={setSummary}
        maxLength={SUMMARY_MAX}
        multiline
        placeholder="Önce ekipte güvenilirlik, sonra görünür etki; geçişi pencere içinde masaya getirmek."
      />

      <View style={{ gap: 10 }}>
        <Txt variant="overline" color="moonMid">
          Aşamalar
        </Txt>
        {phases.map((phase, i) => {
          const startsOn = starts[i];
          const status = phaseStatus(startsOn, phase.endsOn, now);
          const pill = statusPills[status];
          const backwards = phase.endsOn < startsOn;
          return (
            <Card key={phase.key} border={status === 'ACTIVE' ? 'acid' : undefined} style={{ gap: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Txt variant="small" color="moonMid" style={{ flex: 1 }}>
                  Aşama {i + 1}
                </Txt>
                <Pill label={pill.label} tone={pill.tone} />
                {phases.length > 1 ? (
                  <Pressable
                    onPress={() => setPhases((list) => list.filter((p) => p.key !== phase.key))}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel={`Aşama ${i + 1}'i kaldır`}>
                    <Txt variant="small" color="signal">
                      Kaldır
                    </Txt>
                  </Pressable>
                ) : null}
              </View>
              <Field
                label="Ad"
                value={phase.title}
                onChangeText={(title) => update(phase.key, { title })}
                maxLength={TITLE_MAX}
                placeholder={i === 0 ? 'Adaptasyon' : 'Bağımsız üretkenlik'}
              />
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Txt variant="small" color="moonMid">
                  {formatDate(startsOn)} →
                </Txt>
                <Stepper
                  label={`Aşama ${i + 1} bitişi`}
                  value={formatDate(phase.endsOn)}
                  onStep={(delta) =>
                    update(phase.key, {
                      endsOn: minDate(maxDate(addMonths(phase.endsOn, delta), startsOn), goal.windowEnd),
                    })
                  }
                  canDecrease={phase.endsOn > startsOn}
                  canIncrease={phase.endsOn < goal.windowEnd}
                />
              </View>
              {backwards ? (
                <Txt variant="small" color="signal">
                  Önceki aşama bunun bitişini geçti; bitişi ileri al ya da öncekini kısalt.
                </Txt>
              ) : null}
              <Field
                label="Çıkış kanıtı · her satıra bir tane"
                value={phase.exit}
                onChangeText={(exit) => update(phase.key, { exit })}
                maxLength={EXIT_MAX}
                multiline
                placeholder={
                  i === 0
                    ? 'Kredi API akışını yardımsız açıklamak\nİlk 2 görevi büyük revizyonsuz kapatmak'
                    : 'Orta boy bir görevi destek almadan bitirmek\n1 yazılı yönetici geri bildirimi'
                }
              />
            </Card>
          );
        })}
        {canAdd ? (
          <Pressable
            onPress={() =>
              setPhases((list) => [
                ...list,
                { key: newKey(), phaseKey: null, title: '', endsOn: defaultEnd(nextStart, goal.windowEnd), exit: '' },
              ])
            }
            accessibilityRole="button"
            style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, paddingHorizontal: 4 }}>
            <PlusIcon size={16} color="acid" />
            <Txt color="acid">Aşama ekle</Txt>
          </Pressable>
        ) : (
          <Txt variant="small" color="moonFaint">
            {phases.length >= MAX_PHASES ? 'En fazla 12 aşama.' : 'Pencere doldu: son aşama görevin bitişine kadar.'}
          </Txt>
        )}
      </View>

      <Card style={{ gap: 12 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Txt variant="overline" color="moonMid">
            Haftalık yakıt dağılımı
          </Txt>
          <Txt variant="small" color={effortTotal === 100 ? 'moonMid' : 'signal'}>
            Toplam %{effortTotal}
          </Txt>
        </View>
        {categories.map((category) => (
          <View
            key={category}
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Txt>{effortLabels[category]}</Txt>
            <Stepper
              label={effortLabels[category]}
              value={`%${effort[category]}`}
              onStep={(delta) =>
                setEffort((e) => ({ ...e, [category]: Math.min(100, Math.max(0, e[category] + delta * EFFORT_STEP)) }))
              }
              canDecrease={effort[category] > 0}
              canIncrease={effort[category] < 100}
            />
          </View>
        ))}
        {current ? <EffortBar label={`v${current.versionNo}`} allocation={current.effortAllocation} /> : null}
        <EffortBar label={revising ? `v${current.versionNo + 1}` : 'v1'} allocation={effort} highlight />
      </Card>

      {revising ? (
        <Field
          label="Neden değişiyor?"
          value={reason}
          onChangeText={setReason}
          maxLength={REASON_MAX}
          multiline
          placeholder="Yönetici domain bilgisini güçlendirmemi istedi."
          note="Kule ve sonraki sen, rotanın neden değiştiğini buradan okur."
        />
      ) : null}

      {save.isError ? (
        <Txt variant="small" color="signal">
          {errorMessage(save.error)}
        </Txt>
      ) : null}
    </Screen>
  );
}

/** A new phase runs two months by default, inside the window. */
function defaultEnd(startsOn: LocalDate, windowEnd: LocalDate): LocalDate {
  return minDate(addDays(addMonths(startsOn, 2), -1), windowEnd);
}

/** "15 Ara 2026" */
function formatDate(date: LocalDate): string {
  return `${dayMonth(date)} ${date.slice(0, 4)}`;
}
