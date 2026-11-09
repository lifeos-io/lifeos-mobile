import { Link, router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { useCurrentStrategy, useDecisions, useEvidence, useKnowledgeItems, useMainGoal } from '@/api/hooks';
import type { Decision, Evidence, KnowledgeItem, Phase } from '@/api/types';
import {
  Button,
  Card,
  ChevronRightIcon,
  LoadError,
  Loading,
  Pill,
  PlusIcon,
  ProgressBar,
  Screen,
  ScreenHeader,
  Txt,
} from '@/components';
import { clauses, daysBetween, longMonthRange, monthRange, today } from '@/lib/format';
import { decisionPills, decisionsInOrder } from '@/lib/decision';
import { exitTelemetry, knowledgePills } from '@/lib/strategy';
import { colors } from '@/theme';

/**
 * Rota — the destination, its phases, what it rests on (unknowns and assumptions) and the maneuvers made on the
 * way (Figma 03).
 */
export default function RouteScreen() {
  const goal = useMainGoal();
  const strategy = useCurrentStrategy(goal.data?.id);
  const knowledge = useKnowledgeItems(goal.data?.id);
  const evidence = useEvidence(goal.data?.id);
  const decisions = useDecisions();

  const failed = [goal, strategy].find((query) => query.isError);
  if (failed || goal.isPending || (goal.data && strategy.isPending)) {
    return (
      <Screen>
        <ScreenHeader back overline="Varış noktası" title="" />
        {failed ? <LoadError onRetry={() => failed.refetch()} /> : <Loading />}
      </Screen>
    );
  }
  if (!goal.data) {
    return (
      <Screen>
        <ScreenHeader back overline="Varış noktası" title="Henüz görev yok" />
      </Screen>
    );
  }

  const open = (item: KnowledgeItem) => item.status !== 'VERIFIED' && item.status !== 'FALSIFIED';
  const unknowns = (knowledge.data ?? []).filter((item) => item.kind === 'UNKNOWN' && open(item));
  const assumptions = (knowledge.data ?? []).filter((item) => item.kind === 'ASSUMPTION');

  return (
    <Screen>
      <ScreenHeader
        back
        overline="Varış noktası"
        title={goal.data.title}
        subtitle={`Pencere: ${longMonthRange(goal.data.windowStart, goal.data.windowEnd)} · senin hedefin, işverenin taahhüdü değil`}
        aside={
          strategy.data ? (
            <Link href="/route/edit" asChild>
              <Pressable hitSlop={8} accessibilityRole="button" accessibilityLabel="Rotayı düzelt">
                <Txt variant="small" color="acid">
                  Düzelt · v{strategy.data.versionNo}
                </Txt>
              </Pressable>
            </Link>
          ) : null
        }
      />
      {strategy.data ? (
        <Timeline phases={strategy.data.phases} evidence={evidence.data ?? []} />
      ) : (
        <Card border="acid" style={{ gap: 12 }}>
          <Txt variant="bodyStrong">Henüz rota yok.</Txt>
          <Txt variant="small" color="moonMid">
            Varışa giden aşamaları, her birinin çıkış kanıtını ve yakıtın nasıl bölüneceğini çiz.
          </Txt>
          <Button label="Rotayı çiz" onPress={() => router.push('/route/edit')} />
        </Card>
      )}
      <Unknowns items={unknowns} />
      {assumptions.length > 0 ? <Assumptions items={assumptions} /> : null}
      <Link href="/route/unknown" asChild>
        <Pressable
          accessibilityRole="button"
          style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4, paddingHorizontal: 4 }}>
          <PlusIcon size={16} color="acid" />
          <Txt color="acid">Bilinmeyen ya da varsayım ekle</Txt>
        </Pressable>
      </Link>
      <Decisions decisions={decisionsInOrder(decisions.data ?? [])} />
    </Screen>
  );
}

function Timeline({ phases, evidence }: { phases: Phase[]; evidence: Evidence[] }) {
  return (
    <View>
      {phases.map((phase, i) => (
        <View key={phase.phaseKey} style={{ flexDirection: 'row', gap: 14 }}>
          <View style={{ width: 16, alignItems: 'center' }}>
            <View style={[styles.line, { opacity: i === 0 ? 0 : 1, height: phase.status === 'ACTIVE' ? 30 : 6 }]} />
            <PhaseDot status={phase.status} />
            <View style={[styles.line, { flex: 1, opacity: i === phases.length - 1 ? 0 : 1 }]} />
          </View>
          <View style={{ flex: 1, paddingBottom: 22 }}>
            {phase.status === 'ACTIVE' ? <ActivePhase phase={phase} evidence={evidence} /> : <OtherPhase phase={phase} />}
          </View>
        </View>
      ))}
    </View>
  );
}

function PhaseDot({ status }: { status: Phase['status'] }) {
  if (status === 'ACTIVE') {
    return <View style={[styles.dot, { backgroundColor: colors.acid, borderColor: colors.acid }]} />;
  }
  return (
    <View
      style={[
        styles.dot,
        { backgroundColor: status === 'DONE' ? colors.moonFaint : colors.space, borderColor: colors.moonFaint },
      ]}
    />
  );
}

function ActivePhase({ phase, evidence }: { phase: Phase; evidence: Evidence[] }) {
  const criteria = clauses(phase.exitCriteria);
  const { met, needed } = exitTelemetry(phase, evidence);
  return (
    <Card border="acid" style={{ gap: 10 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Txt variant="small" color="acid">
          Aşama {phase.ordinal} · {monthRange(phase.startsOn, phase.endsOn)}
        </Txt>
        <Pill label={`Şimdi · T+${daysBetween(phase.startsOn, today())}`} tone="acid" />
      </View>
      <Txt variant="cardTitle" style={{ fontSize: 18 }}>
        {phase.title}
      </Txt>
      <Txt variant="small" color="moonMid">
        {criteria.length ? `Çıkış kanıtı: ${criteria.join('; ')}.` : 'Çıkış kanıtı henüz yazılmadı.'}
      </Txt>
      {needed > 0 ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View style={{ flex: 1 }}>
            <ProgressBar value={met / needed} />
          </View>
          <Txt variant="small" color="moonMid">
            {met}/{needed} telemetri
          </Txt>
        </View>
      ) : null}
    </Card>
  );
}

function OtherPhase({ phase }: { phase: Phase }) {
  const done = phase.status === 'DONE';
  const criteria = clauses(phase.exitCriteria);
  return (
    <View style={{ gap: 4, opacity: done ? 0.6 : 1 }}>
      <Txt variant="small" color="moonMid">
        Aşama {phase.ordinal} · {monthRange(phase.startsOn, phase.endsOn)}
        {done ? ' · tamamlandı' : ''}
      </Txt>
      <Txt variant="cardTitle">{phase.title}</Txt>
      {criteria.length ? (
        <Txt variant="small" color="moonMid">
          {criteria.join('; ')}.
        </Txt>
      ) : null}
    </View>
  );
}

/** The open unknowns; the ones outside the user's control in sinyal. */
function Unknowns({ items }: { items: KnowledgeItem[] }) {
  if (items.length === 0) {
    return (
      <Card style={{ gap: 4 }}>
        <Txt variant="overline" color="moonMid">
          Bilinmeyenler
        </Txt>
        <Txt variant="small" color="moonMid">
          Henüz yok. Rotanı etkileyen ama cevabını bilmediğin bir soru varsa ekle.
        </Txt>
      </Card>
    );
  }
  return (
    <Card style={{ gap: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Txt variant="overline" color="moonMid">
          Bilinmeyenler
        </Txt>
        <View style={styles.count} accessibilityLabel={`${items.length} bilinmeyen`}>
          <Txt variant="micro" color="signalInk">
            {items.length}
          </Txt>
        </View>
      </View>
      {items.map((item) => (
        <View key={item.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View style={[styles.bullet, { backgroundColor: item.external ? colors.signal : colors.nebula }]} />
          <Txt style={{ flex: 1 }}>{item.statement}</Txt>
          {item.external ? (
            <Txt variant="micro" color="moonFaint">
              DIŞ
            </Txt>
          ) : null}
        </View>
      ))}
    </Card>
  );
}

/** What the route takes as true without having checked it, with where each stands. */
function Assumptions({ items }: { items: KnowledgeItem[] }) {
  return (
    <Card style={{ gap: 12 }}>
      <Txt variant="overline" color="moonMid">
        Varsayımlar
      </Txt>
      {items.map((item) => {
        const pill = knowledgePills[item.status];
        return (
          <View key={item.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Txt style={{ flex: 1 }}>{item.statement}</Txt>
            <Pill label={pill.label} tone={pill.tone} />
          </View>
        );
      })}
    </Card>
  );
}

/** Manevralar: drafts, open and closed decisions, and a new record. */
function Decisions({ decisions }: { decisions: Decision[] }) {
  return (
    <View style={{ gap: 10 }}>
      <Txt variant="overline" color="moonMid">
        Manevralar
      </Txt>
      {decisions.map((decision) => {
        const pill = decisionPills[decision.status];
        return (
          <Link key={decision.id} href={{ pathname: '/decisions/[id]', params: { id: decision.id } }} asChild>
            <Pressable accessibilityRole="button">
              <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Txt variant="bodyStrong" style={{ flex: 1 }}>
                  {decision.title}
                </Txt>
                <Pill label={pill.label} tone={pill.tone} />
                <ChevronRightIcon color="moonMid" />
              </Card>
            </Pressable>
          </Link>
        );
      })}
      <Link href="/decisions/edit" asChild>
        <Pressable
          accessibilityRole="button"
          style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4, paddingHorizontal: 4 }}>
          <PlusIcon size={16} color="acid" />
          <Txt color="acid">Manevra kaydı</Txt>
        </Pressable>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  line: { width: 1.5, backgroundColor: colors.line },
  dot: { width: 14, height: 14, borderRadius: 7, borderWidth: 2 },
  bullet: { width: 6, height: 6, borderRadius: 3 },
  count: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.signal,
  },
});
