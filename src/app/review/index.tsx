import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { useActions, useActiveWeek, useEvidence, useIdeas, useMainGoal, useReviewPreview } from '@/api/hooks';
import { Button, Card, LoadError, Loading, Screen, ScreenHeader, Txt } from '@/components';
import { inWeek } from '@/lib/evidence';
import { clock } from '@/lib/format';
import { energyChoices, findings, weekNumber, type Finding } from '@/lib/review';
import { colors, layout } from '@/theme';

/** Yer kontrolü 1/2 — the week's numbers, the user's energy and Kule's findings (Figma 09). */
export default function ReviewScreen() {
  const week = useActiveWeek();
  const plan = week.data;
  const preview = useReviewPreview(plan?.isoWeek);
  const actions = useActions(plan?.isoWeek);
  const goal = useMainGoal();
  const evidence = useEvidence(goal.data?.id);
  const ideas = useIdeas();
  const [energy, setEnergy] = useState<number>();

  const header = (
    <ScreenHeader
      back
      overline={plan ? `Yer kontrolü · Hafta ${weekNumber(plan.isoWeek)}` : 'Yer kontrolü'}
      title="Haftanın telemetrisi"
      aside={
        <Txt variant="small" color="moonMid">
          ~10 dk
        </Txt>
      }
    />
  );

  if (week.isPending || (plan && preview.isPending)) {
    return (
      <Screen>
        {header}
        <Loading />
      </Screen>
    );
  }
  if (week.isError || preview.isError || !plan || !preview.data) {
    return (
      <Screen>
        {header}
        {week.isError || preview.isError ? (
          <LoadError onRetry={() => (week.isError ? week.refetch() : preview.refetch())} />
        ) : (
          <Txt color="moonMid">Bu hafta için açık bir rota yok; yer kontrolü yapılacak hafta kalmadı.</Txt>
        )}
      </Screen>
    );
  }

  const p = preview.data;
  const total = p.actions.planned + p.actions.done + p.actions.deferred;
  const weekEvidence = (evidence.data ?? []).filter((e) => inWeek(e.occurredOn, plan.weekStart));
  const outcomes = weekEvidence.filter((e) => e.level === 'OUTCOME' || e.level === 'IMPACT').length;
  const activities = weekEvidence.filter((e) => e.level === 'ACTIVITY' || e.level === 'OUTPUT').length;
  const newIdeas = (ideas.data ?? []).filter((i) => inWeek(i.createdAt.slice(0, 10), plan.weekStart));
  const found = findings(plan, p, actions.data ?? [], evidence.data ?? [], ideas.data ?? []);

  return (
    <Screen
      footer={
        <Button
          label="Önerilere geç"
          disabled={energy === undefined}
          onPress={() => router.push({ pathname: '/review/plan', params: { energy: String(energy) } })}
        />
      }>
      {header}

      <View style={styles.grid}>
        <Stat
          label="Adım"
          value={`${p.actions.done} / ${total}`}
          detail={p.actions.deferred ? `${p.actions.deferred} ertelendi` : 'Ertelenen yok'}
        />
        <Stat
          label="Yakıt"
          value={`${clock(p.actions.doneMinutes)} / ${clock(p.actions.plannedMinutes)} sa`}
          detail="Biten / planlanan"
        />
        <Stat
          label="Telemetri"
          value={`${outcomes} sonuç`}
          detail={`${activities} aktivite ve çıktı`}
          warn={outcomes === 0}
        />
        <Stat
          label="Uydu"
          value={`+${newIdeas.length}`}
          detail={newIdeas.length ? 'Yörüngede kaldı' : 'Yeni uydu yok'}
        />
      </View>

      <View style={{ gap: 10 }}>
        <Txt variant="overline" color="moonMid">
          Enerjin · kendi değerlendirmen
        </Txt>
        <View style={styles.segmented} accessibilityRole="radiogroup">
          {energyChoices.map((choice) => {
            const selected = energy === choice.value;
            return (
              <Pressable
                key={choice.value}
                onPress={() => setEnergy(choice.value)}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                style={[styles.segment, selected && { backgroundColor: colors.acid }]}>
                <Txt variant="bodyStrong" color={selected ? 'acidInk' : 'moon'}>
                  {choice.label}
                </Txt>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={{ gap: 10 }}>
        <Txt variant="overline" color="moonMid">
          Kulenin bulguları · en fazla 3
        </Txt>
        {found.map((finding) => (
          <FindingCard key={finding.title} finding={finding} />
        ))}
      </View>
    </Screen>
  );
}

function Stat({ label, value, detail, warn }: { label: string; value: string; detail: string; warn?: boolean }) {
  return (
    <Card border={warn ? 'signal' : undefined} style={styles.stat}>
      <Txt variant="overline" color="moonMid">
        {label}
      </Txt>
      <Txt variant="displayM" color={warn ? 'signal' : 'moon'}>
        {value}
      </Txt>
      <Txt variant="small" color={warn ? 'signal' : 'moonMid'}>
        {detail}
      </Txt>
    </Card>
  );
}

function FindingCard({ finding }: { finding: Finding }) {
  return (
    <Card style={{ flexDirection: 'row', gap: 12, paddingLeft: 12 }}>
      <View style={{ width: 3, borderRadius: 2, backgroundColor: colors[finding.tone] }} />
      <View style={{ flex: 1, gap: 2 }}>
        <Txt variant="bodyStrong">{finding.title}</Txt>
        <Txt variant="small" color="moonMid">
          {finding.detail}
        </Txt>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  stat: { width: '48%', flexGrow: 1, gap: 4 },
  segmented: {
    flexDirection: 'row',
    backgroundColor: colors.cabin,
    borderRadius: layout.buttonHeight / 2,
    padding: 4,
  },
  segment: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
