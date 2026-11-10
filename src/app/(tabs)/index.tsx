import { Link, router } from 'expo-router';
import { Alert, Pressable, View } from 'react-native';

import {
  useActions,
  useChangeActionStatus,
  useCurrentStrategy,
  useIdeas,
  useMainGoal,
  usePendingProposals,
  useWeeklyPlans,
} from '@/api/hooks';
import type { Action, ActionStatus, ChangeProposal, StrategyVersion } from '@/api/types';
import {
  ActionRow,
  Button,
  Card,
  ChevronRightIcon,
  LoadError,
  Loading,
  Orbit,
  Pill,
  PlusIcon,
  ProgressBar,
  Screen,
  ScreenHeader,
  Txt,
} from '@/components';
import { signOut } from '@/auth/session';
import { config } from '@/config';
import { clock, daysBetween, today } from '@/lib/format';
import { activePhase, effortQuestion, focusAction, ideasInOrbit } from '@/lib/strategy';
import { isoWeekOf, plannedMinutes, weekToPlan } from '@/lib/week';

/** Görev — bugün (Figma 02): this week's push, the orbit, the week's steps and a proposal waiting. */
export default function MissionScreen() {
  const goal = useMainGoal();
  const strategy = useCurrentStrategy(goal.data?.id);
  const weeks = useWeeklyPlans();
  const plan = weeks.data?.find((p) => p.status === 'ACTIVE') ?? null;
  const actions = useActions(plan?.isoWeek);
  const ideas = useIdeas();
  const proposals = usePendingProposals();

  const failed = [goal, strategy, weeks, actions].find((query) => query.isError);
  if (failed) {
    return (
      <Screen tab>
        <LoadError onRetry={() => failed.refetch()} />
      </Screen>
    );
  }
  if (goal.isPending || weeks.isPending || (goal.data && strategy.isPending)) {
    return (
      <Screen tab>
        <Loading />
      </Screen>
    );
  }

  const phase = activePhase(strategy.data);
  const overline = phase ? `Aşama ${phase.ordinal} · T+${daysBetween(phase.startsOn, today())} gün` : 'Bu hafta';
  const steps = (actions.data ?? []).filter((action) => action.status !== 'DROPPED');
  const planned = plannedMinutes(steps);
  const proposal = proposals.data?.[0];

  return (
    <Screen tab>
      <ScreenHeader
        overline={overline}
        title="Bu haftanın itkisi"
        titleAside={plan ? <Fuel planned={planned} capacity={plan.capacityMinutes} /> : null}
      />
      {plan ? (
        <ProgressBar
          value={plan.capacityMinutes ? planned / plan.capacityMinutes : 0}
          color={planned > plan.capacityMinutes ? 'signal' : 'acid'}
        />
      ) : null}

      {goal.data ? (
        <Pressable
          onPress={() => router.push('/route')}
          accessibilityRole="button"
          accessibilityHint="Rotayı ve aşamaları açar">
          <Orbit
            showSelf
            satellites={ideasInOrbit(ideas.data ?? []).slice(0, 3)}
            caption={`Varış: ${goal.data.title}`}
          />
        </Pressable>
      ) : null}

      {!goal.data ? (
        <Card border="acid" style={{ gap: 12 }}>
          <Txt variant="bodyStrong">Henüz bir görevin yok.</Txt>
          <Txt variant="small" color="moonMid">
            Tek bir varış noktası seç; rota, haftalar ve telemetri ona göre kurulur.
          </Txt>
          <Button label="Görevini tanımla" onPress={() => router.push('/onboarding')} />
        </Card>
      ) : !strategy.data ? (
        <Card border="acid" style={{ gap: 12 }}>
          <Txt variant="bodyStrong">Rotan henüz çizilmedi.</Txt>
          <Txt variant="small" color="moonMid">
            Varışa giden aşamaları ve yakıtın nasıl bölüneceğini belirle; haftalar buna göre planlanır.
          </Txt>
          <Button label="Rotayı çiz" onPress={() => router.push('/route/edit')} />
        </Card>
      ) : plan ? (
        <Steps isoWeek={plan.isoWeek} steps={steps} loading={actions.isPending} />
      ) : (
        <PlanWeekCard />
      )}

      {proposal && strategy.data ? <ProposalCard proposal={proposal} current={strategy.data} /> : null}

      {plan ? (
        <Link href="/review" asChild>
          <Pressable accessibilityRole="button">
            <Card border="line" fill="space" style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ flex: 1, gap: 2 }}>
                <Txt variant="bodyStrong">Yer kontrolü</Txt>
                <Txt variant="small" color="moonMid">
                  Haftayı kapat, gelecek haftanın rotasını seç · ~10 dk
                </Txt>
              </View>
              <ChevronRightIcon color="moonMid" />
            </Card>
          </Pressable>
        </Link>
      ) : null}

      {/* Temporary: until there is a profile screen. */}
      {config.data === 'live' ? (
        <Pressable onPress={() => signOut()} accessibilityRole="button">
          <Txt variant="small" color="moonMid">
            Çıkış yap ›
          </Txt>
        </Pressable>
      ) : null}
    </Screen>
  );
}

/** No active week: plan this one (or the next, once this one is reviewed), or go on with its draft. */
function PlanWeekCard() {
  const weeks = useWeeklyPlans();
  const { isoWeek, draft } = weekToPlan(weeks.data ?? [], today());
  const next = isoWeek !== isoWeekOf(today());
  return (
    <Card border="acid" style={{ gap: 12 }}>
      <Txt variant="bodyStrong">
        {draft ? 'Haftanın taslağı hazır.' : next ? 'Bu hafta kapandı.' : 'Bu hafta itki yok.'}
      </Txt>
      <Txt variant="small" color="moonMid">
        {draft
          ? 'Adımlarını tamamla ve itkiyi ateşle; o zaman burada görünür.'
          : next
            ? 'Gelecek haftanın yakıtını ve adımlarını seç.'
            : 'Yakıtını ve adımlarını seç, sonra itkiyi ateşle.'}
      </Txt>
      <Button
        label={draft ? 'Taslağa devam et' : next ? 'Gelecek haftayı planla' : 'Haftayı planla'}
        onPress={() => router.push({ pathname: '/week', params: { isoWeek } })}
      />
    </Card>
  );
}

/** "Yakıt 3:50 / 4 sa": the time the week's steps take against its capacity. */
function Fuel({ planned, capacity }: { planned: number; capacity: number }) {
  return (
    <View
      style={{ alignItems: 'flex-end', marginTop: -18 }}
      accessible
      accessibilityLabel={`Yakıt: ${clock(planned)} / ${clock(capacity)} saat`}>
      <Txt variant="small" color="moonMid">
        Yakıt
      </Txt>
      <Txt variant="counter" color={planned > capacity ? 'signal' : 'moon'}>
        {clock(planned)} / {clock(capacity)} sa
      </Txt>
    </View>
  );
}

function Steps({ isoWeek, steps, loading }: { isoWeek: string; steps: Action[]; loading: boolean }) {
  const changeStatus = useChangeActionStatus(isoWeek);
  const focus = focusAction(steps);
  const set = (action: Action, status: ActionStatus) => changeStatus.mutate({ action, status });

  // Finishing a step that should leave telemetry asks for it while it is fresh.
  const finish = (action: Action) =>
    changeStatus.mutate(
      { action, status: 'DONE' },
      {
        onSuccess: () => {
          if (!action.expectedEvidence) return;
          Alert.alert('Telemetri kaydet?', `Beklenen: ${action.expectedEvidence}`, [
            { text: 'Sonra', style: 'cancel' },
            { text: 'Kaydet', onPress: () => router.push({ pathname: '/evidence/new', params: { actionId: action.id } }) },
          ]);
        },
      },
    );

  // Long press: push the step back, or let it go (its time returns to the week).
  const more = (action: Action) => {
    if (action.status === 'DONE') return;
    Alert.alert(action.title, undefined, [
      action.status === 'DEFERRED'
        ? { text: 'Plana geri al', onPress: () => set(action, 'PLANNED') }
        : { text: 'Ertele', onPress: () => set(action, 'DEFERRED') },
      { text: 'Bırak', style: 'destructive', onPress: () => set(action, 'DROPPED') },
      { text: 'Vazgeç', style: 'cancel' },
    ]);
  };

  return (
    <View style={{ gap: 10 }}>
      <Txt variant="overline" color="moonMid">
        Rotadaki {steps.length} adım
      </Txt>
      {loading ? <Loading /> : null}
      {steps.map((action) => (
        <ActionRow
          key={action.id}
          action={action}
          focused={action.id === focus?.id}
          onPress={() => (action.status === 'DONE' ? set(action, 'PLANNED') : finish(action))}
          onLongPress={() => more(action)}
        />
      ))}
      <Link href={{ pathname: '/week/step', params: { isoWeek } }} asChild>
        <Pressable
          accessibilityRole="button"
          style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4, paddingHorizontal: 4 }}>
          <PlusIcon size={16} color="acid" />
          <Txt color="acid">Adım ekle</Txt>
        </Pressable>
      </Link>
    </View>
  );
}

function ProposalCard({ proposal, current }: { proposal: ChangeProposal; current: StrategyVersion }) {
  const question = effortQuestion(current.effortAllocation, proposal.revision.effortAllocation);
  return (
    <Link href={{ pathname: '/proposals/[id]', params: { id: proposal.id } }} asChild>
      <Pressable accessibilityRole="button">
        <Card border="nebula" fill="nebulaInk" style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ flex: 1, gap: 10 }}>
            <Pill label="Rota düzeltmesi" tone="nebula" />
            <Txt variant="bodyStrong">{`${question ?? proposal.revision.summary} Onayını bekliyor.`}</Txt>
          </View>
          <ChevronRightIcon color="nebula" />
        </Card>
      </Pressable>
    </Link>
  );
}
