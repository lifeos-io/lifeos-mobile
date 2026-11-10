import { Link, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import {
  useActions,
  useActiveWeek,
  useCurrentStrategy,
  useEvidence,
  useFeedbackList,
  useMainGoal,
  useRecordEvidence,
} from '@/api/hooks';
import type {
  Action,
  Evidence,
  EvidenceLevel,
  EvidenceStrength,
  Feedback,
  Goal,
  LocalDate,
  StrategyVersion,
  Uuid,
} from '@/api/types';
import {
  Button,
  Card,
  Chips,
  Field,
  LoadError,
  Loading,
  PickRow,
  PlusIcon,
  PrivacyNote,
  Screen,
  ScreenHeader,
  Stepper,
  Txt,
} from '@/components';
import { errorMessage } from '@/lib/errors';
import {
  canBuildOn,
  levelHints,
  levelLabels,
  levels,
  sourceKindLabels,
  strengthLabels,
  strengths,
} from '@/lib/evidence';
import { dayMonth, duration, pastDay, today } from '@/lib/format';
import { goBack } from '@/lib/navigation';
import { addDays } from '@/lib/route';
import { activePhase } from '@/lib/strategy';

const TITLE_MAX = 200;
const NOTE_MAX = 2000;
/** How far back a record can be dated from here. */
const DAYS_BACK = 60;
const PICK_LIMIT = 4;

const NO_PHASE = '';

/**
 * Telemetri kaydı — what measurably changed: a title, its step on the chain (activity → impact), how strong the
 * signal is, the day it happened, and optionally what it builds on, the step it came from, the phase it counts for
 * and the feedback that confirms it. `actionId` comes from a finished step on Görev, `feedbackId` from a feedback
 * just recorded.
 */
export default function NewEvidenceScreen() {
  const params = useLocalSearchParams<{ actionId?: string; feedbackId?: string }>();
  const goal = useMainGoal();
  const strategy = useCurrentStrategy(goal.data?.id);
  const evidence = useEvidence(goal.data?.id);
  const feedback = useFeedbackList();
  const week = useActiveWeek();
  const actions = useActions(week.data?.isoWeek);

  const queries = [goal, strategy, evidence, feedback, week, actions];
  const failed = queries.find((query) => query.isError);
  const loading =
    goal.isPending ||
    feedback.isPending ||
    week.isPending ||
    (!!goal.data && (strategy.isPending || evidence.isPending)) ||
    (!!week.data && actions.isPending);

  if (failed || loading) {
    return (
      <Screen>
        <ScreenHeader back fallback="/evidence" overline="Telemetri kaydı" title="" />
        {failed ? <LoadError onRetry={() => failed.refetch()} /> : <Loading />}
      </Screen>
    );
  }
  if (!goal.data) {
    return (
      <Screen>
        <ScreenHeader back fallback="/evidence" overline="Telemetri kaydı" title="Önce görevini tanımla" />
      </Screen>
    );
  }
  return (
    <EvidenceForm
      goal={goal.data}
      strategy={strategy.data ?? null}
      evidence={evidence.data ?? []}
      feedback={feedback.data ?? []}
      steps={actions.data ?? []}
      actionId={params.actionId ?? null}
      feedbackId={params.feedbackId ?? null}
    />
  );
}

function EvidenceForm({
  goal,
  strategy,
  evidence,
  feedback,
  steps,
  actionId: initialActionId,
  feedbackId: initialFeedbackId,
}: {
  goal: Goal;
  strategy: StrategyVersion | null;
  evidence: Evidence[];
  feedback: Feedback[];
  steps: Action[];
  actionId: Uuid | null;
  feedbackId: Uuid | null;
}) {
  const record = useRecordEvidence();
  const fromAction = steps.find((a) => a.id === initialActionId);
  const earliest = addDays(today(), -DAYS_BACK);

  const [title, setTitle] = useState(fromAction?.expectedEvidence ?? '');
  // A step's expected telemetry is usually something made; a confirming feedback, something that worked.
  const [level, setLevel] = useState<EvidenceLevel>(
    fromAction ? 'OUTPUT' : initialFeedbackId ? 'OUTCOME' : 'ACTIVITY',
  );
  const [occurredOn, setOccurredOn] = useState<LocalDate>(today());
  const [parentId, setParentId] = useState<Uuid | null>(null);
  const [actionId, setActionId] = useState<Uuid | null>(fromAction?.id ?? null);
  const [phaseKey, setPhaseKey] = useState<Uuid>(
    fromAction?.phaseKey ?? activePhase(strategy)?.phaseKey ?? NO_PHASE,
  );
  const [note, setNote] = useState('');

  // A feedback recorded from this screen (via "+ Geri bildirim kaydet") is picked when it comes back.
  const [knownFeedback] = useState(() => new Set(feedback.map((f) => f.id)));
  const fresh = feedback.find((f) => !knownFeedback.has(f.id));
  const [feedbackChoice, setFeedbackChoice] = useState<Uuid | null | undefined>(undefined);
  const feedbackId = feedbackChoice === undefined ? (fresh?.id ?? initialFeedbackId) : feedbackChoice;
  // Strength follows the feedback link until the user picks one.
  const [strengthChoice, setStrength] = useState<EvidenceStrength | undefined>(undefined);
  const strength = strengthChoice ?? (feedbackId ? 'EXTERNAL_FEEDBACK' : 'SELF_REPORT');

  const parents = evidence.filter((e) => canBuildOn(level, e.level));
  // A parent that no longer fits the chosen level is dropped, not sent.
  const parent = parents.find((e) => e.id === parentId) ?? null;
  const doneSteps = steps.filter((a) => a.status === 'DONE' || a.id === initialActionId);
  const phases = strategy?.phases ?? [];

  const ready = !!title.trim() && record.isIdle;

  const submit = () =>
    record.mutate(
      {
        title: title.trim(),
        level,
        strength,
        occurredOn,
        parentEvidenceId: parent?.id ?? null,
        actionId,
        feedbackId: feedbackId ?? null,
        note: note.trim() || null,
        goalIds: [goal.id],
        phaseKeys: phaseKey === NO_PHASE ? [] : [phaseKey],
      },
      { onSuccess: () => goBack('/evidence') },
    );

  return (
    <Screen footer={<Button label="Telemetriyi kaydet" disabled={!ready} onPress={submit} />}>
      <ScreenHeader
        back
        fallback="/evidence"
        overline="Telemetri kaydı"
        title="Ne değişti?"
        subtitle="Saat değil, ortaya çıkan şey. Küçük de olsa somut."
      />

      <Field
        label="Telemetri"
        value={title}
        onChangeText={setTitle}
        maxLength={TITLE_MAX}
        autoFocus={!fromAction}
        placeholder="Alışveriş kredisi akış diyagramı"
      />

      <View style={{ gap: 10 }}>
        <Txt variant="overline" color="moonMid">
          Zincirdeki yeri
        </Txt>
        <Chips
          label="Zincirdeki yeri"
          options={levels.map((l) => ({ value: l, label: levelLabels[l] }))}
          value={level}
          onChange={setLevel}
        />
        <Txt variant="small" color="moonFaint">
          {levelHints[level]}
        </Txt>
      </View>

      <View style={{ gap: 10 }}>
        <Txt variant="overline" color="moonMid">
          Sinyal gücü
        </Txt>
        <Chips
          label="Sinyal gücü"
          options={strengths.map((s) => ({ value: s, label: strengthLabels[s] }))}
          value={strength}
          onChange={setStrength}
        />
        <Txt variant="small" color="moonFaint">
          Zayıftan güçlüye: kendi beyanın, kişisel projen, işteki çıktın, başkasının teyidi.
        </Txt>
      </View>

      <Card style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Txt variant="overline" color="moonMid">
          Ne zaman
        </Txt>
        <Stepper
          label="Tarih"
          value={pastDay(occurredOn)}
          onStep={(delta) => setOccurredOn((d) => addDays(d, delta))}
          canDecrease={occurredOn > earliest}
          canIncrease={occurredOn < today()}
        />
      </Card>

      {level !== 'ACTIVITY' ? (
        <Picker
          title="Neyin üstüne kuruluyor? (isteğe bağlı)"
          empty={`${levelLabels[level]} adımının altında henüz bir kayıt yok.`}
          items={parents.slice(0, PICK_LIMIT).map((e) => ({
            id: e.id,
            title: e.title,
            meta: `${levelLabels[e.level]} · ${dayMonth(e.occurredOn)}`,
          }))}
          selected={parent?.id ?? null}
          onSelect={setParentId}
        />
      ) : null}

      {doneSteps.length > 0 ? (
        <Picker
          title="Hangi adımdan çıktı? (isteğe bağlı)"
          items={doneSteps.slice(0, PICK_LIMIT).map((a) => ({
            id: a.id,
            title: a.title,
            meta: duration(a.estimateMinutes),
          }))}
          selected={actionId}
          onSelect={setActionId}
        />
      ) : null}

      {phases.length > 0 ? (
        <View style={{ gap: 10 }}>
          <Txt variant="overline" color="moonMid">
            Hangi aşamanın çıkışına sayılır?
          </Txt>
          <Chips
            label="Aşama"
            options={[
              ...phases.map((p) => ({ value: p.phaseKey, label: `${p.ordinal} · ${p.title}` })),
              { value: NO_PHASE, label: 'Hiçbiri' },
            ]}
            value={phaseKey}
            onChange={setPhaseKey}
          />
        </View>
      ) : null}

      <View style={{ gap: 10 }}>
        <Picker
          title="Bir geri bildirim teyit ediyor mu? (isteğe bağlı)"
          empty="Henüz geri bildirim kaydı yok."
          items={feedback.slice(0, PICK_LIMIT).map((f) => ({
            id: f.id,
            title: f.content,
            meta: `${f.sourceLabel ?? sourceKindLabels[f.sourceKind]} · ${dayMonth(f.receivedOn)}`,
          }))}
          selected={feedbackId ?? null}
          onSelect={setFeedbackChoice}
        />
        <Link href={{ pathname: '/feedback/new', params: { from: 'evidence' } }} asChild>
          <Pressable
            accessibilityRole="button"
            style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4, paddingHorizontal: 4 }}>
            <PlusIcon size={16} color="acid" />
            <Txt color="acid">Geri bildirim kaydet</Txt>
          </Pressable>
        </Link>
      </View>

      <Field
        label="Not (isteğe bağlı)"
        value={note}
        onChangeText={setNote}
        maxLength={NOTE_MAX}
        multiline
        placeholder="Ekip akışı doğruladı; iki adım eksikti, ekledim."
      />
      <PrivacyNote />

      {record.isError ? (
        <Txt variant="small" color="signal">
          {errorMessage(record.error)}
        </Txt>
      ) : null}
    </Screen>
  );
}

/** A titled list of optional links: tap to pick, tap again to unpick. */
function Picker({
  title,
  empty,
  items,
  selected,
  onSelect,
}: {
  title: string;
  empty?: string;
  items: { id: Uuid; title: string; meta?: string }[];
  selected: Uuid | null;
  onSelect: (id: Uuid | null) => void;
}) {
  return (
    <View style={{ gap: 10 }} accessibilityRole="radiogroup" accessibilityLabel={title}>
      <Txt variant="overline" color="moonMid">
        {title}
      </Txt>
      {items.length === 0 && empty ? (
        <Txt variant="small" color="moonFaint">
          {empty}
        </Txt>
      ) : null}
      {items.map((item) => (
        <PickRow
          key={item.id}
          title={item.title}
          meta={item.meta}
          selected={item.id === selected}
          onPress={() => onSelect(item.id === selected ? null : item.id)}
        />
      ))}
    </View>
  );
}
