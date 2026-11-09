import { router, useLocalSearchParams } from 'expo-router';
import { Alert, View } from 'react-native';

import { useCurrentStrategy, useDecideProposal, useFeedback, useProposal } from '@/api/hooks';
import type { ChangeProposal, Feedback, StrategyVersion } from '@/api/types';
import {
  Button,
  Card,
  EffortBar,
  EffortLegend,
  LoadError,
  Loading,
  Pill,
  PlusIcon,
  Screen,
  ScreenHeader,
  Txt,
} from '@/components';
import { dayMonth } from '@/lib/format';
import { addedCriteria, sameEffort, samePhases } from '@/lib/strategy';

const sourceKinds: Record<Feedback['sourceKind'], string> = {
  MANAGER: 'yönetici',
  PEER: 'ekip arkadaşı',
  CODE_REVIEW: 'kod incelemesi',
  SELF: 'kendin',
  OTHER: 'diğer',
};
const reliabilities: Record<Feedback['reliability'], string> = {
  HIGH: 'güvenilirlik yüksek',
  MEDIUM: 'güvenilirlik orta',
  LOW: 'güvenilirlik düşük',
};
const decided: Partial<Record<ChangeProposal['status'], string>> = {
  ACCEPTED: 'Onaylandı',
  REJECTED: 'Reddedildi',
  SUPERSEDED: 'Yerine yenisi geldi',
};

/** Rota düzeltmesi — a strategy revision proposal and its decision (Figma 04). */
export default function ProposalScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const proposal = useProposal(id);
  const current = useCurrentStrategy(proposal.data?.goalId);
  const feedbackSource = proposal.data?.sources.find((source) => source.type === 'FEEDBACK');
  const feedback = useFeedback(feedbackSource?.id);
  const decide = useDecideProposal(id);

  if (proposal.isError || proposal.isPending || current.isPending) {
    return (
      <Screen>
        <ScreenHeader back accent="nebula" overline="Rota düzeltmesi" title="" />
        {proposal.isError ? <LoadError onRetry={() => proposal.refetch()} /> : <Loading />}
      </Screen>
    );
  }

  const p = proposal.data;
  const base = current.data;
  const open = p.status === 'PENDING' && p.applicable;
  const from = p.basedOnVersionNo ?? base?.versionNo ?? 0;
  const keepsPhases = base ? samePhases(base.phases, p.revision.phases) : false;
  const keepsEffort = base ? sameEffort(base.effortAllocation, p.revision.effortAllocation) : false;
  const title = `Hedef aynı. ${keepsEffort ? 'Aşamalar' : 'Ağırlıklar'} değişiyor.`;

  const onDecided = () => router.back();
  const reject = () =>
    Alert.alert('Rota düzeltmesini reddet', 'Kule bu öneriyi kapatır; mevcut rota aynen kalır.', [
      { text: 'Vazgeç', style: 'cancel' },
      { text: 'Reddet', style: 'destructive', onPress: () => decide.mutate({ accept: false }, { onSuccess: onDecided }) },
    ]);

  return (
    <Screen
      footer={
        open ? (
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <Button kind="ghost" label="Reddet" disabled={decide.isPending} onPress={reject} />
            <Button
              label={`Onayla, v${from + 1}'e geç`}
              disabled={decide.isPending}
              onPress={() => decide.mutate({ accept: true }, { onSuccess: onDecided })}
              style={{ flex: 1 }}
            />
          </View>
        ) : undefined
      }>
      <ScreenHeader back accent="nebula" overline={`Rota düzeltmesi · v${from} → v${from + 1}`} title={title} />

      {!open ? <Pill label={decided[p.status] ?? 'Artık uygulanamaz'} tone="ghost" /> : null}

      {feedback.data ? <FeedbackCard feedback={feedback.data} rationale={p.rationale} /> : null}

      {base && !keepsEffort ? <EffortCard base={base} proposal={p} from={from} /> : null}

      <Changes base={base} proposal={p} keepsPhases={keepsPhases} />

      {decide.isError ? (
        <Txt variant="small" color="signal">
          Karar kaydedilemedi. Tekrar dene.
        </Txt>
      ) : null}
    </Screen>
  );
}

function FeedbackCard({ feedback, rationale }: { feedback: Feedback; rationale: string }) {
  return (
    <Card style={{ gap: 12 }}>
      <Pill label={`Geri bildirim · ${dayMonth(feedback.receivedOn)}`} tone="ghost" />
      <Txt variant="cardTitle" style={{ fontSize: 17, lineHeight: 24 }}>
        “{feedback.content}”
      </Txt>
      <Txt variant="small" color="moonMid">
        Kaynak: {feedback.sourceLabel?.toLocaleLowerCase('tr-TR') ?? sourceKinds[feedback.sourceKind]} ·{' '}
        {reliabilities[feedback.reliability]}
      </Txt>
      <Txt variant="small" color="moonMid">
        {rationale}
      </Txt>
    </Card>
  );
}

function EffortCard({ base, proposal, from }: { base: StrategyVersion; proposal: ChangeProposal; from: number }) {
  return (
    <Card style={{ gap: 14 }}>
      <Txt variant="overline" color="moonMid">
        Haftalık yakıt dağılımı
      </Txt>
      <EffortBar label={`v${from}`} allocation={base.effortAllocation} />
      <EffortBar label={`v${from + 1}`} allocation={proposal.revision.effortAllocation} highlight />
      <EffortLegend />
    </Card>
  );
}

function Changes({
  base,
  proposal,
  keepsPhases,
}: {
  base: StrategyVersion | null | undefined;
  proposal: ChangeProposal;
  keepsPhases: boolean;
}) {
  const changes = [
    ...(base ? addedCriteria(base.phases, proposal.revision.phases) : []),
    ...proposal.revision.changeReason.split('\n').map((line) => line.trim()),
  ].filter(Boolean);
  const kept = ['hedef', 'zaman penceresi', ...(keepsPhases ? ['aşamalar ve tarihleri'] : [])];
  return (
    <View style={{ gap: 12 }}>
      <Txt variant="overline" color="moonMid">
        Ne değişiyor
      </Txt>
      {changes.map((change) => (
        <View key={change} style={{ flexDirection: 'row', gap: 10 }}>
          <View style={{ paddingTop: 1 }}>
            <PlusIcon size={18} color="acid" />
          </View>
          <Txt style={{ flex: 1 }}>{change}</Txt>
        </View>
      ))}
      <Txt variant="small" color="moonFaint">
        Korunan: {kept.join(', ')}
      </Txt>
    </View>
  );
}
