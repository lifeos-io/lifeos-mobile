import { StyleSheet, View } from 'react-native';

import { useCurrentStrategy, useEvidence, useKnowledgeItems, useMainGoal } from '@/api/hooks';
import type { Evidence, KnowledgeItem, Phase } from '@/api/types';
import { Card, LoadError, Loading, Pill, ProgressBar, Screen, ScreenHeader, Txt } from '@/components';
import { clauses, daysBetween, longMonthRange, monthRange, today } from '@/lib/format';
import { exitTelemetry } from '@/lib/strategy';
import { colors } from '@/theme';

/** Rota — the destination and its phases (Figma 03). */
export default function RouteScreen() {
  const goal = useMainGoal();
  const strategy = useCurrentStrategy(goal.data?.id);
  const knowledge = useKnowledgeItems(goal.data?.id);
  const evidence = useEvidence(goal.data?.id);

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

  const unknowns = (knowledge.data ?? []).filter(
    (item) => item.kind === 'UNKNOWN' && item.external && item.status !== 'VERIFIED' && item.status !== 'FALSIFIED',
  );

  return (
    <Screen>
      <ScreenHeader
        back
        overline="Varış noktası"
        title={goal.data.title}
        subtitle={`Pencere: ${longMonthRange(goal.data.windowStart, goal.data.windowEnd)} · senin hedefin, işverenin taahhüdü değil`}
      />
      {strategy.data ? <Timeline phases={strategy.data.phases} evidence={evidence.data ?? []} /> : null}
      {unknowns.length > 0 ? <Unknowns items={unknowns} /> : null}
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
        Çıkış kanıtı: {criteria.join('; ')}.
      </Txt>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <View style={{ flex: 1 }}>
          <ProgressBar value={needed ? met / needed : 0} />
        </View>
        <Txt variant="small" color="moonMid">
          {met}/{needed} telemetri
        </Txt>
      </View>
    </Card>
  );
}

function OtherPhase({ phase }: { phase: Phase }) {
  const done = phase.status === 'DONE';
  return (
    <View style={{ gap: 4, opacity: done ? 0.6 : 1 }}>
      <Txt variant="small" color="moonMid">
        Aşama {phase.ordinal} · {monthRange(phase.startsOn, phase.endsOn)}
        {done ? ' · tamamlandı' : ''}
      </Txt>
      <Txt variant="cardTitle">{phase.title}</Txt>
      <Txt variant="small" color="moonMid">
        {clauses(phase.exitCriteria).join('; ')}.
      </Txt>
    </View>
  );
}

function Unknowns({ items }: { items: KnowledgeItem[] }) {
  return (
    <Card style={{ gap: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Txt variant="overline" color="moonMid">
          Bilinmeyenler · dış
        </Txt>
        <View style={styles.count} accessibilityLabel={`${items.length} bilinmeyen`}>
          <Txt variant="micro" color="signalInk">
            {items.length}
          </Txt>
        </View>
      </View>
      {items.map((item) => (
        <View key={item.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View style={[styles.bullet, { backgroundColor: colors.signal }]} />
          <Txt style={{ flex: 1 }}>{item.statement}</Txt>
        </View>
      ))}
    </Card>
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
