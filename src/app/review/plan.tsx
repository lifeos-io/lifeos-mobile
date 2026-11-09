import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';

import {
  useActiveWeek,
  useCompleteReview,
  useCurrentStrategy,
  useDecisions,
  useMainGoal,
  usePendingProposals,
} from '@/api/hooks';
import type { Decision } from '@/api/types';
import { Button, Card, CheckIcon, Screen, ScreenHeader, Txt } from '@/components';
import { errorMessage } from '@/lib/errors';
import { nextIsoWeek, weekNumber } from '@/lib/review';
import { colors, layout, typography } from '@/theme';

const FOCUS_MAX = 500;

type Verdict = 'useful' | 'not' | 'unknown';
const verdicts: { value: Verdict; label: string }[] = [
  { value: 'useful', label: 'Faydalı' },
  { value: 'not', label: 'Değil' },
  { value: 'unknown', label: 'Henüz bilmiyorum' },
];

/**
 * Yer kontrolü 2/2 — next week's focus, what needs the user's approval, and how the last maneuver went (Figma 10).
 * "Rotayı onayla" writes the review (Strategy closes the week); the maneuver answer goes into went-well / stuck.
 */
export default function ReviewPlanScreen() {
  const { energy } = useLocalSearchParams<{ energy?: string }>();
  const week = useActiveWeek();
  const goal = useMainGoal();
  const strategy = useCurrentStrategy(goal.data?.id);
  const proposals = usePendingProposals();
  const decisions = useDecisions();
  const complete = useCompleteReview(week.data?.isoWeek ?? '');

  const [focus, setFocus] = useState('');
  const [reviewProposal, setReviewProposal] = useState(false);
  const [verdict, setVerdict] = useState<Verdict>();

  const plan = week.data;
  const next = plan ? weekNumber(nextIsoWeek(plan.weekStart)) : undefined;
  const proposal = proposals.data?.[0];
  const decision = lastOpenDecision(decisions.data ?? []);
  const energyValue = Number(energy);

  const confirm = () => {
    if (!plan || !Number.isInteger(energyValue)) return;
    const quoted = decision ? `“${decision.title}”` : '';
    complete.mutate(
      {
        energy: energyValue,
        nextWeekFocus: focus.trim() || null,
        wentWell: decision && verdict === 'useful' ? `${quoted} işe yaradı.` : null,
        gotStuck: decision && verdict === 'not' ? `${quoted} işe yaramadı.` : null,
        lesson: null,
      },
      {
        onSuccess: () => {
          if (router.canDismiss()) router.dismissAll();
          else router.replace('/');
          if (reviewProposal && proposal) {
            router.push({ pathname: '/proposals/[id]', params: { id: proposal.id } });
          }
        },
      },
    );
  };

  return (
    <Screen
      footer={
        <Button
          label="Rotayı onayla"
          disabled={!plan || !Number.isInteger(energyValue) || !complete.isIdle}
          onPress={confirm}
        />
      }>
      <ScreenHeader back overline="Yer kontrolü · 2/2" title={next ? `Hafta ${next} rotası` : 'Gelecek hafta'} />

      <Card fill="acid" style={{ gap: 6 }}>
        <Txt variant="overline" color="acidInk">
          Haftanın odağı
        </Txt>
        <TextInput
          value={focus}
          onChangeText={setFocus}
          maxLength={FOCUS_MAX}
          multiline
          placeholder="Gelecek hafta neye odaklanıyorsun?"
          placeholderTextColor="rgba(16, 20, 10, 0.5)"
          selectionColor={colors.acidInk}
          accessibilityLabel="Haftanın odağı"
          style={[typography.cardTitle, { color: colors.acidInk, fontSize: 18, lineHeight: 24, padding: 0 }]}
        />
      </Card>

      {proposal && strategy.data ? (
        <View style={{ gap: 10 }}>
          <Txt variant="overline" color="moonMid">
            Onayın olmadan uygulanmaz
          </Txt>
          <Check
            label={`Rota düzeltmesi v${strategy.data.versionNo + 1}'ü incele`}
            checked={reviewProposal}
            onToggle={() => setReviewProposal((value) => !value)}
          />
        </View>
      ) : null}

      {decision ? (
        <Card border="nebula" fill="nebulaInk" style={{ gap: 12 }}>
          <Txt variant="bodyStrong">“{decision.title}” uyguladın. İşe yaradı mı?</Txt>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {verdicts.map((option) => {
              const selected = verdict === option.value;
              return (
                <Pressable
                  key={option.value}
                  onPress={() => setVerdict(option.value)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                    borderRadius: 999,
                    borderWidth: 1,
                    borderColor: selected ? colors.acid : colors.line,
                    backgroundColor: selected ? colors.acid : 'transparent',
                  }}>
                  <Txt variant="micro" color={selected ? 'acidInk' : 'moonMid'}>
                    {option.label.toLocaleUpperCase('tr-TR')}
                  </Txt>
                </Pressable>
              );
            })}
          </View>
        </Card>
      ) : null}

      {complete.isError ? (
        <Txt variant="small" color="signal">
          {errorMessage(complete.error)}
        </Txt>
      ) : null}
    </Screen>
  );
}

/** The most recently decided decision still open: the maneuver to follow up on. */
function lastOpenDecision(decisions: Decision[]): Decision | undefined {
  return decisions
    .filter((d) => d.status === 'OPEN' && d.decidedAt)
    .sort((a, b) => b.decidedAt!.localeCompare(a.decidedAt!))[0];
}

function Check({ label, checked, onToggle }: { label: string; checked: boolean; onToggle: () => void }) {
  return (
    <Pressable
      onPress={onToggle}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: colors.cabin,
        borderRadius: layout.cardRadius,
        paddingVertical: 14,
        paddingHorizontal: layout.cardPadding,
        opacity: pressed ? 0.85 : 1,
      })}>
      <View
        style={{
          width: 22,
          height: 22,
          borderRadius: 6,
          borderWidth: checked ? 0 : 1.5,
          borderColor: colors.moonFaint,
          backgroundColor: checked ? colors.acid : 'transparent',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        {checked ? <CheckIcon size={14} color="acidInk" /> : null}
      </View>
      <Txt style={{ flex: 1 }}>{label}</Txt>
    </Pressable>
  );
}
