import { Link, router, useLocalSearchParams } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { useDecision, useKnowledgeById } from '@/api/hooks';
import type { Decision, KnowledgeItem } from '@/api/types';
import { Button, Card, ChevronRightIcon, LoadError, Loading, Pill, Screen, ScreenHeader, Txt } from '@/components';
import { decisionPills, wouldDecideAgainLabels } from '@/lib/decision';
import { dayMonth, daysBetween, today } from '@/lib/format';
import { knowledgePills } from '@/lib/strategy';
import { colors } from '@/theme';

/**
 * Manevra kaydı — a decision: the options weighed, the assumptions under it, what should follow (Figma 07). A draft
 * is edited and decided from here; an open decision is closed or reopened; a reopened one leads to its successor.
 */
export default function DecisionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const decision = useDecision(id);
  const knowledge = useKnowledgeById(decision.data?.goalId);

  if (decision.isError || decision.isPending) {
    return (
      <Screen>
        <ScreenHeader back fallback="/route" accent="moonMid" overline="Manevra kaydı" title="" />
        {decision.isError ? <LoadError onRetry={() => decision.refetch()} /> : <Loading />}
      </Screen>
    );
  }

  const d = decision.data;
  const status = decisionPills[d.status];
  const trigger = d.reopenTriggers.find((t) => t.kind === 'DATE' && t.firesOn && !t.firedAt);
  const falsified = d.falsifiedAssumptionIds.length > 0 && d.status === 'OPEN';
  const assumptions = d.assumptionIds
    .map((assumptionId) => knowledge.data?.get(assumptionId))
    .filter((item): item is KnowledgeItem => !!item);

  return (
    <Screen footer={<Actions decision={d} />}>
      <ScreenHeader back fallback="/route" accent="moonMid" overline="Manevra kaydı" title={d.title} />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: -12 }}>
        <Pill label={status.label} tone={status.tone} />
        {d.decidedAt ? <Pill label={dayMonth(d.decidedAt.slice(0, 10))} tone="muted" /> : null}
        {d.reviewOn && d.status === 'OPEN' ? (
          <Pill label={`Değerlendirme · ${dayMonth(d.reviewOn)}`} tone="ghost" />
        ) : null}
        {trigger?.firesOn && (d.status === 'DRAFT' || d.status === 'OPEN') ? (
          <Pill label={`Yeniden bakış · ${dayMonth(trigger.firesOn)}`} tone="ghost" />
        ) : null}
      </View>

      {d.reopenedAsId ? <Successor id={d.reopenedAsId} superseded={d.status === 'SUPERSEDED'} /> : null}
      {falsified ? (
        <Card border="signal" fill="signalInk" style={{ gap: 4 }}>
          <Txt variant="bodyStrong">Dayandığı bir varsayım yanlışlandı.</Txt>
          <Txt variant="small">Karar hâlâ geçerli mi? Yeniden açıp seçenekleri tekrar tartabilirsin.</Txt>
        </Card>
      ) : null}
      {d.reopenReason ? (
        <Card border="nebula" fill="nebulaInk" style={{ gap: 4 }}>
          <Txt variant="small" color="nebula">
            Neden yeniden açıldı
          </Txt>
          <Txt variant="small">{d.reopenReason}</Txt>
        </Card>
      ) : null}
      {d.context ? <Txt color="moonMid">{d.context}</Txt> : null}

      <Alternatives alternatives={d.alternatives} draft={d.status === 'DRAFT'} />

      {assumptions.length > 0 ? (
        <View style={{ gap: 10 }}>
          <Txt variant="overline" color="moonMid">
            Dayandığı varsayımlar
          </Txt>
          {assumptions.map((item) => {
            const pill = knowledgePills[item.status];
            return (
              <View key={item.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Txt style={{ flex: 1 }}>{item.statement}</Txt>
                <Pill label={pill.label} tone={pill.tone} />
              </View>
            );
          })}
        </View>
      ) : null}

      {d.expectedOutcome ? (
        <Card style={{ gap: 6 }}>
          <Txt variant="overline" color="acid">
            Beklenen sonuç · ölçülebilir
          </Txt>
          <Txt>{d.expectedOutcome}</Txt>
        </Card>
      ) : null}

      {d.decidedAt && d.reviewOn ? <Checkpoints from={d.decidedAt.slice(0, 10)} to={d.reviewOn} /> : null}

      {d.outcomeNote ? (
        <Card style={{ gap: 6 }}>
          <Txt variant="overline" color="moonMid">
            Sonuç
          </Txt>
          <Txt>{d.outcomeNote}</Txt>
          {d.wouldDecideAgain ? (
            <Txt variant="small" color="moonMid">
              {wouldDecideAgainLabels[d.wouldDecideAgain]}
            </Txt>
          ) : null}
        </Card>
      ) : null}
    </Screen>
  );
}

function Alternatives({ alternatives, draft }: { alternatives: Decision['alternatives']; draft: boolean }) {
  return (
    <View style={{ gap: 10 }}>
      <Txt variant="overline" color="moonMid">
        Değerlendirilen manevralar
      </Txt>
      <View style={styles.grid}>
        {alternatives.map((alternative) => (
          <Card
            key={alternative.label}
            border={alternative.chosen ? 'acid' : 'line'}
            fill={alternative.chosen ? 'cabin' : 'space'}
            style={styles.cell}>
            <Txt variant="bodyStrong">
              {alternative.label} · {alternative.description}
            </Txt>
            <Txt variant="small" color={alternative.chosen ? 'acid' : 'moonMid'}>
              {alternative.chosen
                ? 'Seçildi'
                : (alternative.rejectionReason ?? (draft ? 'Henüz karar verilmedi' : 'Elendi'))}
            </Txt>
          </Card>
        ))}
      </View>
    </View>
  );
}

/** What can be done with the decision now: a draft is edited or decided, an open one closed or reopened. */
function Actions({ decision }: { decision: Decision }) {
  const go = (pathname: '/decisions/edit' | '/decisions/decide' | '/decisions/close' | '/decisions/reopen') =>
    router.push({ pathname, params: { id: decision.id } });
  const canReopen = (decision.status === 'OPEN' || decision.status === 'CLOSED') && !decision.reopenedAsId;
  if (decision.status === 'DRAFT') {
    return (
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Button label="Düzenle" kind="ghost" style={{ flex: 1 }} onPress={() => go('/decisions/edit')} />
        <Button label="Karar ver" style={{ flex: 1 }} onPress={() => go('/decisions/decide')} />
      </View>
    );
  }
  if (decision.status === 'OPEN') {
    return (
      <View style={{ flexDirection: 'row', gap: 10 }}>
        {canReopen ? (
          <Button label="Yeniden aç" kind="ghost" style={{ flex: 1 }} onPress={() => go('/decisions/reopen')} />
        ) : null}
        <Button label="Kapat" style={{ flex: 1 }} onPress={() => go('/decisions/close')} />
      </View>
    );
  }
  return canReopen ? <Button label="Yeniden aç" kind="ghost" onPress={() => go('/decisions/reopen')} /> : null;
}

/** The draft this decision was reopened as (and, once decided, replaced by). */
function Successor({ id, superseded }: { id: string; superseded: boolean }) {
  return (
    <Link href={{ pathname: '/decisions/[id]', params: { id } }} asChild>
      <Pressable accessibilityRole="button">
        <Card border="nebula" style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Txt variant="small" style={{ flex: 1 }}>
            {superseded ? 'Yeniden tartıldı ve yerine yeni karar geldi.' : 'Yeniden açıldı; yeni taslak seni bekliyor.'}
          </Txt>
          <ChevronRightIcon color="nebula" />
        </Card>
      </Pressable>
    </Link>
  );
}

/** Weekly checkpoints from the decision to its review, the ones passed in acid. */
function Checkpoints({ from, to }: { from: string; to: string }) {
  const total = Math.max(daysBetween(from, to), 0);
  const steps = Math.max(1, Math.round(total / 7));
  const points = Array.from({ length: steps + 1 }, (_, i) => Math.round((total * i) / steps));
  const elapsed = daysBetween(from, today());
  const shift = (days: number) => {
    const [y, m, d] = from.split('-').map(Number);
    const date = new Date(Date.UTC(y, m - 1, d + days));
    return date.toISOString().slice(0, 10);
  };
  const progress = Math.max(0, Math.min(1, total ? elapsed / total : 0));

  return (
    <View accessible accessibilityLabel={`${dayMonth(from)} ile ${dayMonth(to)} arası, ${Math.round(progress * 100)}% geçti`}>
      <View style={styles.track}>
        <View style={[styles.trackLine, { right: 0, backgroundColor: colors.line }]} />
        <View style={[styles.trackLine, { backgroundColor: colors.acid, width: `${progress * 100}%` }]} />
        {points.map((day, i) => {
          const passed = day <= elapsed;
          const last = i === points.length - 1;
          return (
            <View
              key={day}
              style={[
                styles.point,
                { left: `${(day / (total || 1)) * 100}%` },
                passed
                  ? { backgroundColor: colors.acid, borderColor: colors.acid }
                  : { backgroundColor: colors.space, borderColor: last ? colors.nebula : colors.moonFaint },
              ]}
            />
          );
        })}
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
        {points.map((day, i) => (
          <Txt
            key={day}
            variant="small"
            color={day <= elapsed ? 'acid' : i === points.length - 1 ? 'nebula' : 'moonMid'}>
            {dayMonth(shift(day))}
          </Txt>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  cell: { width: '48%', flexGrow: 1, gap: 4, paddingVertical: 12, paddingHorizontal: 12 },
  track: { height: 14, justifyContent: 'center', marginHorizontal: 7 },
  trackLine: { position: 'absolute', left: 0, height: 2, borderRadius: 1 },
  point: { position: 'absolute', width: 14, height: 14, marginLeft: -7, borderRadius: 7, borderWidth: 2 },
});
