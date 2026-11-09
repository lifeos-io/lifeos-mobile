import { Link, router, type Href } from 'expo-router';
import { Pressable, View } from 'react-native';

import {
  useActions,
  useActiveWeek,
  useChangeActionStatus,
  useCurrentStrategy,
  useIdeas,
  useMainGoal,
  usePendingProposals,
} from '@/api/hooks';
import type { Action, ChangeProposal, StrategyVersion } from '@/api/types';
import {
  ActionRow,
  Card,
  ChevronRightIcon,
  LoadError,
  Loading,
  Orbit,
  Pill,
  ProgressBar,
  Screen,
  ScreenHeader,
  Txt,
} from '@/components';
import { clock, daysBetween, today } from '@/lib/format';
import { activePhase, effortQuestion, focusAction, ideasInOrbit } from '@/lib/strategy';

/** Temporary: reaches the screens that have no entry point yet. */
const unreachedScreens: { href: Href; label: string }[] = [
  { href: '/onboarding', label: '01 Görev tanımı' },
  { href: '/ideas/demo', label: '06 Uydu değerlendirmesi' },
  { href: '/decisions/demo', label: '07 Manevra kaydı' },
  { href: '/review', label: '09 Yer kontrolü' },
];

/** Görev — bugün (Figma 02): this week's push, the orbit, the week's steps and a proposal waiting. */
export default function MissionScreen() {
  const goal = useMainGoal();
  const strategy = useCurrentStrategy(goal.data?.id);
  const week = useActiveWeek();
  const actions = useActions(week.data?.isoWeek);
  const ideas = useIdeas();
  const proposals = usePendingProposals();

  const failed = [goal, strategy, week, actions].find((query) => query.isError);
  if (failed) {
    return (
      <Screen tab>
        <LoadError onRetry={() => failed.refetch()} />
      </Screen>
    );
  }
  if (goal.isPending || week.isPending || (goal.data && strategy.isPending)) {
    return (
      <Screen tab>
        <Loading />
      </Screen>
    );
  }

  const phase = activePhase(strategy.data);
  const plan = week.data;
  const overline = phase ? `Aşama ${phase.ordinal} · T+${daysBetween(phase.startsOn, today())} gün` : 'Bu hafta';
  const steps = (actions.data ?? []).filter((action) => action.status !== 'DROPPED');
  const proposal = proposals.data?.[0];

  return (
    <Screen tab>
      <ScreenHeader
        overline={overline}
        title="Bu haftanın itkisi"
        titleAside={plan ? <Fuel allocated={plan.allocatedMinutes} capacity={plan.capacityMinutes} /> : null}
      />
      {plan ? (
        <ProgressBar
          value={plan.allocatedMinutes / plan.capacityMinutes}
          color={plan.allocatedMinutes > plan.capacityMinutes ? 'signal' : 'acid'}
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

      {plan ? (
        <Steps isoWeek={plan.isoWeek} steps={steps} loading={actions.isPending} />
      ) : (
        <Card>
          <Txt variant="bodyStrong">Bu hafta için rota yok.</Txt>
          <Txt variant="small" color="moonMid" style={{ marginTop: 4 }}>
            Yer kontrolünde haftanın adımlarını seçtiğinde burada görünür.
          </Txt>
        </Card>
      )}

      {proposal && strategy.data ? <ProposalCard proposal={proposal} current={strategy.data} /> : null}

      <View style={{ gap: 8 }}>
        <Txt variant="overline" color="moonFaint">
          Ekranlar (geçici)
        </Txt>
        {unreachedScreens.map(({ href, label }) => (
          <Link key={label} href={href} asChild>
            <Pressable>
              <Txt variant="small" color="moonMid">
                {label} ›
              </Txt>
            </Pressable>
          </Link>
        ))}
      </View>
    </Screen>
  );
}

/** "Yakıt 3:50 / 4 sa": the week's planned time against its capacity. */
function Fuel({ allocated, capacity }: { allocated: number; capacity: number }) {
  return (
    <View
      style={{ alignItems: 'flex-end', marginTop: -18 }}
      accessible
      accessibilityLabel={`Yakıt: ${clock(allocated)} / ${clock(capacity)} saat`}>
      <Txt variant="small" color="moonMid">
        Yakıt
      </Txt>
      <Txt variant="counter" color={allocated > capacity ? 'signal' : 'moon'}>
        {clock(allocated)} / {clock(capacity)} sa
      </Txt>
    </View>
  );
}

function Steps({ isoWeek, steps, loading }: { isoWeek: string; steps: Action[]; loading: boolean }) {
  const changeStatus = useChangeActionStatus(isoWeek);
  const focus = focusAction(steps);
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
          onPress={() =>
            changeStatus.mutate({ action, status: action.status === 'DONE' ? 'PLANNED' : 'DONE' })
          }
        />
      ))}
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
