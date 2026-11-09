import { useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';

import { useChangeIdea, useIdea, useMainGoal } from '@/api/hooks';
import type { IdeaTransition } from '@/api/strategy';
import type { Idea } from '@/api/types';
import { Button, Card, LoadError, Loading, Pill, Screen, ScreenHeader, Txt } from '@/components';
import { errorMessage } from '@/lib/errors';
import { dayMonth, duration } from '@/lib/format';
import { goBack } from '@/lib/navigation';
import { colors, type ColorToken } from '@/theme';

type Evaluation = Idea['evaluations'][number];

const verdicts: Record<Evaluation['verdict'], { label: string; fill: ColorToken; ink: ColorToken }> = {
  PURSUE: { label: 'Keşif', fill: 'nebula', ink: 'nebulaInk' },
  PARK: { label: 'Park', fill: 'cabinRaised', ink: 'moon' },
  DROP: { label: 'Bırak', fill: 'signal', ink: 'signalInk' },
};

const statusLabels: Record<Idea['status'], string> = {
  INBOX: 'Yörüngede',
  ACTIVE: 'Aktif',
  SHELVED: 'Park',
  DROPPED: 'Bırakıldı',
  PROMOTED: 'Hedefe dönüştü',
};

/** Uydu değerlendirmesi — one idea, its latest evaluation and what can be done with it (Figma 06). */
export default function IdeaScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const idea = useIdea(id);
  const goal = useMainGoal();
  const change = useChangeIdea(id);

  if (idea.isError || idea.isPending) {
    return (
      <Screen>
        <ScreenHeader back fallback="/ideas" accent="moonMid" overline="Uydu değerlendirmesi" title="" />
        {idea.isError ? <LoadError onRetry={() => idea.refetch()} /> : <Loading />}
      </Screen>
    );
  }

  const i = idea.data;
  const latest = i.evaluations.at(-1);
  const linkedGoal = goal.data && goal.data.id === i.goalId ? goal.data.title : null;
  const run = (transition: IdeaTransition, leave = false) =>
    change.mutate(transition, { onSuccess: () => (leave ? goBack('/ideas') : undefined) });

  return (
    <Screen footer={final(i) ? undefined : <Actions idea={i} pending={change.isPending} run={run} />}>
      <ScreenHeader back fallback="/ideas" accent="moonMid" overline="Uydu değerlendirmesi" title={i.title} />

      {i.status !== 'INBOX' ? <Pill label={statusLabels[i.status]} tone={i.status === 'ACTIVE' ? 'acid' : 'ghost'} /> : null}

      {latest ? <Verdict evaluation={latest} /> : <Unevaluated />}

      <Card style={{ gap: 0, paddingVertical: 4 }}>
        {linkedGoal ? <Row label="Hedefe bağ" body={linkedGoal} score={latest?.goalFit} /> : null}
        {i.note ? <Row label="Sinyalin kaynağı" body={i.note} /> : null}
        {latest ? (
          <>
            <Row label="Kanıt potansiyeli" score={latest.evidencePotential} />
            <Row label="Enerji" score={latest.energy} />
            <Row label="Haftalık yakıt" body={duration(latest.weeklyMinutes)} last />
          </>
        ) : null}
      </Card>

      {latest ? (
        <Txt variant="small" color="moonFaint">
          Son değerlendirme: {dayMonth(latest.evaluatedAt.slice(0, 10))}
          {i.evaluations.length > 1 ? ` · ${i.evaluations.length} değerlendirme` : ''}
        </Txt>
      ) : null}

      {change.isError ? (
        <Txt variant="small" color="signal">
          {errorMessage(change.error)}
        </Txt>
      ) : null}
    </Screen>
  );
}

function Verdict({ evaluation }: { evaluation: Evaluation }) {
  const verdict = verdicts[evaluation.verdict];
  return (
    <Card fill={verdict.fill} style={{ gap: 6 }}>
      <Txt variant="overline" color={verdict.ink}>
        Karar önerisi
      </Txt>
      <Txt variant="displayL" color={verdict.ink}>
        {verdict.label}
        {evaluation.verdict === 'PURSUE' ? ` · ${duration(evaluation.weeklyMinutes)}` : ''}
      </Txt>
      {evaluation.note ? (
        <Txt variant="small" color={verdict.ink}>
          {evaluation.note}
        </Txt>
      ) : null}
    </Card>
  );
}

function Unevaluated() {
  return (
    <Card border="line" fill="space" style={{ gap: 4 }}>
      <Txt variant="bodyStrong">Henüz değerlendirilmedi.</Txt>
      <Txt variant="small" color="moonMid">
        Yer kontrolünde hedefe bağı, kanıt potansiyeli ve enerjisi puanlanır; karar ondan sonra.
      </Txt>
    </Card>
  );
}

function Row({ label, body, score, last }: { label: string; body?: string; score?: number; last?: boolean }) {
  return (
    <View
      style={{
        paddingVertical: 12,
        gap: 4,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: colors.line,
      }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Txt variant="overline" color="moonMid">
          {label}
        </Txt>
        {score !== undefined ? <Score value={score} /> : null}
      </View>
      {body ? <Txt>{body}</Txt> : null}
    </View>
  );
}

/** A 1–5 score as five segments. */
function Score({ value }: { value: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 3 }} accessible accessibilityLabel={`5 üzerinden ${value}`}>
      {[1, 2, 3, 4, 5].map((step) => (
        <View
          key={step}
          style={{
            width: 14,
            height: 6,
            borderRadius: 3,
            backgroundColor: step <= value ? colors.nebula : colors.cabinRaised,
          }}
        />
      ))}
    </View>
  );
}

/** DROPPED and PROMOTED ideas are read-only. */
function final(idea: Idea): boolean {
  return idea.status === 'DROPPED' || idea.status === 'PROMOTED';
}

/** What the idea's status allows (Strategy: activate needs a PURSUE verdict, shelve, reopen, drop). */
function Actions({
  idea,
  pending,
  run,
}: {
  idea: Idea;
  pending: boolean;
  run: (transition: IdeaTransition, leave?: boolean) => void;
}) {
  const pursued = idea.evaluations.at(-1)?.verdict === 'PURSUE';
  const row = (children: React.ReactNode) => <View style={{ flexDirection: 'row', gap: 12 }}>{children}</View>;
  switch (idea.status) {
    case 'INBOX':
      return row(
        <>
          <Button kind="ghost" label="Park et" disabled={pending} onPress={() => run('shelve', true)} />
          {pursued ? (
            <Button label="Keşfi başlat" disabled={pending} onPress={() => run('activate')} style={{ flex: 1 }} />
          ) : (
            <Button kind="ghost" label="Bırak" disabled={pending} onPress={() => run('drop', true)} style={{ flex: 1 }} />
          )}
        </>,
      );
    case 'ACTIVE':
      return row(
        <>
          <Button kind="ghost" label="Bırak" disabled={pending} onPress={() => run('drop', true)} />
          <Button label="Park et" disabled={pending} onPress={() => run('shelve', true)} style={{ flex: 1 }} />
        </>,
      );
    case 'SHELVED':
      return row(
        <>
          <Button kind="ghost" label="Bırak" disabled={pending} onPress={() => run('drop', true)} />
          <Button label="Yörüngeye geri al" disabled={pending} onPress={() => run('reopen')} style={{ flex: 1 }} />
        </>,
      );
    default:
      return null;
  }
}
