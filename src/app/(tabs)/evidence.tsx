import { router } from 'expo-router';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { useActiveWeek, useCurrentStrategy, useEvidence, useMainGoal } from '@/api/hooks';
import type { Evidence, Phase } from '@/api/types';
import {
  Card,
  LoadError,
  Loading,
  Pill,
  PlusIcon,
  PrivacyNote,
  Screen,
  ScreenHeader,
  Txt,
  type PillTone,
} from '@/components';
import {
  inWeek,
  latestChain,
  levelHints,
  levelLabels,
  phaseStrength,
  strengthLabels,
  strengths,
  type ChainStep,
} from '@/lib/evidence';
import { colors, type ColorToken } from '@/theme';

/** Telemetri — what has measurably changed (Figma 08): the latest signal chain and signal strength per phase. */
export default function EvidenceScreen() {
  const goal = useMainGoal();
  const evidence = useEvidence(goal.data?.id);
  const strategy = useCurrentStrategy(goal.data?.id);
  const week = useActiveWeek();

  const chain = latestChain(evidence.data ?? []);

  return (
    <Screen tab>
      <ScreenHeader
        overline="Ölçülebilir ilerleme"
        title="Telemetri"
        subtitle="Saat ilerleme değildir. Burada yalnızca hayatında neyin değiştiği sayılır."
        titleAside={<AddButton />}
      />

      {evidence.isError ? <LoadError onRetry={() => evidence.refetch()} /> : null}
      {goal.isPending || evidence.isPending ? <Loading /> : null}

      {chain ? (
        <Chain steps={chain} weekStart={week.data?.weekStart} />
      ) : evidence.isSuccess ? (
        <Card border="line" fill="space">
          <Txt variant="bodyStrong">Henüz telemetri yok.</Txt>
          <Txt variant="small" color="moonMid" style={{ marginTop: 4 }}>
            Bir adımı bitirdiğinde ortaya çıkanı + ile kaydet; zincir oradan büyür.
          </Txt>
        </Card>
      ) : null}

      {strategy.data && evidence.data ? <Strength phases={strategy.data.phases} evidence={evidence.data} /> : null}

      <PrivacyNote />
    </Screen>
  );
}

/** "+": a new piece of evidence, or a feedback received (which may then be recorded as evidence too). */
function AddButton() {
  const choose = () =>
    Alert.alert('Ne kaydedeceksin?', undefined, [
      { text: 'Telemetri', onPress: () => router.push('/evidence/new') },
      { text: 'Geri bildirim', onPress: () => router.push('/feedback/new') },
      { text: 'Vazgeç', style: 'cancel' },
    ]);
  return (
    <Pressable
      onPress={choose}
      accessibilityRole="button"
      accessibilityLabel="Kaydet: telemetri ya da geri bildirim"
      hitSlop={8}
      style={({ pressed }) => ({
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: colors.acid,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: pressed ? 0.8 : 1,
      })}>
      <PlusIcon size={22} color="acidInk" />
    </Pressable>
  );
}

function stepState(step: ChainStep, weekStart: string | undefined): { pill: string; tone: PillTone; dot: ColorToken | null } {
  if (!step.evidence) return { pill: 'Bekleniyor', tone: 'ghost', dot: null };
  if (weekStart && inWeek(step.evidence.occurredOn, weekStart)) return { pill: 'Bu hafta', tone: 'nebula', dot: 'nebula' };
  return { pill: 'Kayıtlı', tone: 'acid', dot: 'acid' };
}

function Chain({ steps, weekStart }: { steps: ChainStep[]; weekStart: string | undefined }) {
  return (
    <Card style={{ gap: 0 }}>
      <Txt variant="overline" color="moonMid" style={{ marginBottom: 12 }}>
        Bir sinyal zinciri
      </Txt>
      {steps.map((step, i) => {
        const state = stepState(step, weekStart);
        const last = i === steps.length - 1;
        return (
          <View key={step.level} style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ width: 12, alignItems: 'center' }}>
              <View
                style={[
                  styles.dot,
                  state.dot
                    ? { backgroundColor: colors[state.dot], borderColor: colors[state.dot] }
                    : { backgroundColor: colors.cabin, borderColor: colors.moonFaint },
                ]}
              />
              {last ? null : <View style={styles.link} />}
            </View>
            <View style={{ flex: 1, paddingBottom: last ? 0 : 16, gap: 2 }}>
              <Txt variant="small" color="moonMid">
                {levelLabels[step.level]}
              </Txt>
              <Txt variant="bodyStrong" color={step.evidence ? 'moon' : 'moonMid'}>
                {step.evidence?.title ?? levelHints[step.level]}
              </Txt>
            </View>
            <Pill label={state.pill} tone={state.tone} />
          </View>
        );
      })}
    </Card>
  );
}

/** Per phase: the strongest kind of evidence so far, on the ladder self-report → external feedback. */
function Strength({ phases, evidence }: { phases: Phase[]; evidence: Evidence[] }) {
  return (
    <View style={{ gap: 12 }}>
      <Txt variant="overline" color="moonMid">
        Aşama başına sinyal gücü
      </Txt>
      {phases.map((phase) => {
        const started = phase.status !== 'UPCOMING';
        const strength = phaseStrength(phase, evidence);
        return (
          <View key={phase.phaseKey} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Txt style={{ flex: 1 }} color={started ? 'moon' : 'moonMid'}>
              {phase.title}
            </Txt>
            {started ? (
              <>
                <Meter value={strength} />
                <Txt variant="small" color={strength ? 'moonMid' : 'signal'} style={{ width: 92, textAlign: 'right' }}>
                  {strength ? strengthLabels[strengths[strength - 1]] : 'Veri yok'}
                </Txt>
              </>
            ) : (
              <Txt variant="small" color="moonFaint" style={{ textAlign: 'right' }}>
                Başlamadı
              </Txt>
            )}
          </View>
        );
      })}
      <Txt variant="small" color="moonFaint">
        {strengths.map((s) => strengthLabels[s]).join(' › ')}
      </Txt>
    </View>
  );
}

function Meter({ value }: { value: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 3 }} accessible accessibilityLabel={`4 üzerinden ${value}`}>
      {[1, 2, 3, 4].map((step) => (
        <View
          key={step}
          style={{
            width: 14,
            height: 6,
            borderRadius: 3,
            backgroundColor: step <= value ? (value >= 3 ? colors.acid : colors.nebula) : colors.cabinRaised,
          }}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  dot: { width: 12, height: 12, borderRadius: 6, borderWidth: 2, marginTop: 4 },
  link: { flex: 1, width: 1.5, backgroundColor: colors.line, marginTop: 4 },
});
