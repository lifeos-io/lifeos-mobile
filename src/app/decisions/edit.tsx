import { Link, router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { useChangeDecision, useCreateDecision, useDecision, useKnowledgeItems, useMainGoal } from '@/api/hooks';
import type { Decision, DecisionDraft, Goal, KnowledgeItem, LocalDate, Uuid } from '@/api/types';
import {
  Button,
  Card,
  Field,
  LoadError,
  Loading,
  Pill,
  PlusIcon,
  Screen,
  ScreenHeader,
  Stepper,
  Toggle,
  Txt,
} from '@/components';
import { errorMessage } from '@/lib/errors';
import { dayMonth, today } from '@/lib/format';
import { addDays } from '@/lib/route';
import { knowledgePills } from '@/lib/strategy';

const TITLE_MAX = 200;
const CONTEXT_MAX = 4000;
const OPTION_MAX = 1000;
const MAX_OPTIONS = 6;
const LABELS = 'ABCDEF';
const TRIGGER_TEXT = 'Tarih geldi: manevrayı yeniden değerlendir.';

type Option = { key: string; description: string; rejectionReason: string };

let nextKey = 0;
const newOption = (description = '', rejectionReason = ''): Option => ({
  key: `o${nextKey++}`,
  description,
  rejectionReason,
});

/**
 * Manevra kaydı — writing a decision down before making it: what is being decided, the options weighed (A–F),
 * the assumptions it rests on and when to look at it again. Saved as a draft; deciding is the next step.
 * `id` edits an existing draft (a new one, or a decision reopened as a draft).
 */
export default function DecisionEditScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const goal = useMainGoal();
  const knowledge = useKnowledgeItems(goal.data?.id);

  if (goal.isError || knowledge.isError) {
    return (
      <Screen>
        <ScreenHeader back fallback="/route" accent="moonMid" overline="Manevra kaydı" title="" />
        <LoadError onRetry={() => (goal.isError ? goal.refetch() : knowledge.refetch())} />
      </Screen>
    );
  }
  if (goal.isPending || (goal.data && knowledge.isPending)) {
    return (
      <Screen>
        <ScreenHeader back fallback="/route" accent="moonMid" overline="Manevra kaydı" title="" />
        <Loading />
      </Screen>
    );
  }
  const assumptions = (knowledge.data ?? []).filter((item) => item.kind === 'ASSUMPTION');
  return id ? (
    <ExistingDraft id={id} goal={goal.data} assumptions={assumptions} />
  ) : (
    <DecisionEditor goal={goal.data} assumptions={assumptions} />
  );
}

function ExistingDraft({ id, goal, assumptions }: { id: Uuid; goal: Goal | null; assumptions: KnowledgeItem[] }) {
  const decision = useDecision(id);
  if (decision.isError || decision.isPending) {
    return (
      <Screen>
        <ScreenHeader back fallback="/route" accent="moonMid" overline="Manevra kaydı" title="" />
        {decision.isError ? <LoadError onRetry={() => decision.refetch()} /> : <Loading />}
      </Screen>
    );
  }
  if (decision.data.status !== 'DRAFT') {
    return (
      <Screen>
        <ScreenHeader back fallback="/route" accent="moonMid" overline="Manevra kaydı" title="Bu manevra artık taslak değil" />
      </Screen>
    );
  }
  return <DecisionEditor goal={goal} assumptions={assumptions} initial={decision.data} />;
}

function DecisionEditor({
  goal,
  assumptions,
  initial,
}: {
  goal: Goal | null;
  assumptions: KnowledgeItem[];
  initial?: Decision;
}) {
  const create = useCreateDecision();
  const change = useChangeDecision(initial?.id ?? '');
  const save = initial ? change.update : create;
  const tomorrow = addDays(today(), 1);

  const [title, setTitle] = useState(initial?.title ?? '');
  const [context, setContext] = useState(initial?.context ?? '');
  const [options, setOptions] = useState<Option[]>(() =>
    initial?.alternatives.length
      ? initial.alternatives.map((a) => newOption(a.description, a.rejectionReason ?? ''))
      : [newOption(), newOption()],
  );
  const [assumptionIds, setAssumptionIds] = useState<Uuid[]>(initial?.assumptionIds ?? []);
  const initialTrigger = initial?.reopenTriggers.find((t) => t.kind === 'DATE' && t.firesOn && !t.firedAt);
  const [lookAgain, setLookAgain] = useState(!!initialTrigger);
  const [firesOn, setFiresOn] = useState<LocalDate>(initialTrigger?.firesOn ?? addDays(today(), 28));

  const ready =
    title.trim().length > 0 && options.length >= 2 && options.every((o) => o.description.trim()) && save.isIdle;

  const update = (key: string, changes: Partial<Option>) =>
    setOptions((list) => list.map((o) => (o.key === key ? { ...o, ...changes } : o)));
  const toggleAssumption = (assumptionId: Uuid) =>
    setAssumptionIds((ids) => (ids.includes(assumptionId) ? ids.filter((x) => x !== assumptionId) : [...ids, assumptionId]));

  const submit = () => {
    const draft: DecisionDraft = {
      goalId: initial?.goalId ?? goal?.id ?? null,
      title: title.trim(),
      context: context.trim() || null,
      alternatives: options.map((o) => ({
        description: o.description.trim(),
        rejectionReason: o.rejectionReason.trim() || null,
      })),
      assumptionIds,
      reopenTriggers: lookAgain
        ? [{ kind: 'DATE', description: initialTrigger?.description ?? TRIGGER_TEXT, eventType: null, firesOn }]
        : [],
    };
    const show = (saved: Decision) =>
      router.replace({ pathname: '/decisions/[id]', params: { id: saved.id } });
    if (initial) {
      change.update.mutate({ ...draft, version: initial.version }, { onSuccess: show });
    } else {
      create.mutate(draft, { onSuccess: show });
    }
  };

  // A reopened draft keeps the options it had; the screen reads like a second look, not a new record.
  const reopened = !!initial?.reopenedFromId;

  return (
    <Screen footer={<Button label="Taslağı kaydet" disabled={!ready} onPress={submit} />}>
      <ScreenHeader
        back
        fallback="/route"
        accent="moonMid"
        overline={reopened ? 'Manevra kaydı · yeniden' : 'Manevra kaydı · taslak'}
        title={initial ? 'Manevrayı düzenle' : 'Neye karar veriyorsun?'}
        subtitle="Seçenekleri ve dayandığın varsayımları yaz; kararı sonra ver."
      />
      {initial?.reopenReason ? (
        <Card border="nebula" fill="nebulaInk" style={{ gap: 4 }}>
          <Txt variant="small" color="nebula">
            Neden yeniden açıldı
          </Txt>
          <Txt variant="small">{initial.reopenReason}</Txt>
        </Card>
      ) : null}

      <Field
        label="Karar"
        value={title}
        onChangeText={setTitle}
        maxLength={TITLE_MAX}
        autoFocus={!initial}
        placeholder="Kubernetes'e devam mı, OAuth 2.0'a odak mı?"
      />
      <Field
        label="Bağlam (isteğe bağlı)"
        value={context}
        onChangeText={setContext}
        maxLength={CONTEXT_MAX}
        multiline
        placeholder="Direktör AI'ın önemli olduğunu söyledi; ekipte K8s ihtiyacı doğrulanmadı."
      />

      <View style={{ gap: 10 }}>
        <Txt variant="overline" color="moonMid">
          Değerlendirilen manevralar
        </Txt>
        {options.map((option, i) => (
          <Card key={option.key} style={{ gap: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Pill label={LABELS[i]} tone="nebula" />
              {options.length > 2 ? (
                <Pressable
                  onPress={() => setOptions((list) => list.filter((o) => o.key !== option.key))}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel={`${LABELS[i]} seçeneğini kaldır`}>
                  <Txt variant="small" color="signal">
                    Kaldır
                  </Txt>
                </Pressable>
              ) : null}
            </View>
            <Field
              label="Seçenek"
              value={option.description}
              onChangeText={(description) => update(option.key, { description })}
              maxLength={OPTION_MAX}
              placeholder={i === 0 ? "K8s'e devam" : i === 1 ? 'OAuth 2.0 / ÖHVPS' : 'Tamamen AI’a geç'}
            />
            <Field
              label="Elenirse neden? (isteğe bağlı)"
              value={option.rejectionReason}
              onChangeText={(rejectionReason) => update(option.key, { rejectionReason })}
              maxLength={OPTION_MAX}
              placeholder="İhtiyaç doğrulanmadı"
              note={i === 0 ? 'Karar verirken seçilmeyen her seçeneğin bir nedeni olmalı.' : undefined}
            />
          </Card>
        ))}
        {options.length < MAX_OPTIONS ? (
          <Pressable
            onPress={() => setOptions((list) => [...list, newOption()])}
            accessibilityRole="button"
            style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, paddingHorizontal: 4 }}>
            <PlusIcon size={16} color="acid" />
            <Txt color="acid">Seçenek ekle</Txt>
          </Pressable>
        ) : null}
      </View>

      <View style={{ gap: 10 }}>
        <Txt variant="overline" color="moonMid">
          Dayandığı varsayımlar
        </Txt>
        {assumptions.length === 0 ? (
          <Txt variant="small" color="moonMid">
            Henüz varsayım yok.
          </Txt>
        ) : (
          <Card style={{ gap: 4 }}>
            {assumptions.map((item) => {
              const pill = knowledgePills[item.status];
              return (
                <View key={item.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={{ flex: 1 }}>
                    <Toggle
                      label={item.statement}
                      value={assumptionIds.includes(item.id)}
                      onChange={() => toggleAssumption(item.id)}
                    />
                  </View>
                  <Pill label={pill.label} tone={pill.tone} />
                </View>
              );
            })}
          </Card>
        )}
        <Link href={{ pathname: '/route/unknown', params: { kind: 'ASSUMPTION' } }} asChild>
          <Pressable
            accessibilityRole="button"
            style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4, paddingHorizontal: 4 }}>
            <PlusIcon size={16} color="acid" />
            <Txt color="acid">Varsayım ekle</Txt>
          </Pressable>
        </Link>
      </View>

      <Card style={{ gap: 10 }}>
        <Toggle label="Bir tarihte yeniden bak" value={lookAgain} onChange={setLookAgain} />
        {lookAgain ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Txt variant="small" color="moonMid">
              Tetikleyici
            </Txt>
            <Stepper
              label="Yeniden bakış tarihi"
              value={`${dayMonth(firesOn)} ${firesOn.slice(0, 4)}`}
              onStep={(delta) => setFiresOn((d) => (addDays(d, delta * 7) < tomorrow ? tomorrow : addDays(d, delta * 7)))}
              canDecrease={firesOn > tomorrow}
            />
          </View>
        ) : (
          <Txt variant="small" color="moonFaint">
            Tarih gelince Kule bu manevrayı yeniden önüne getirir.
          </Txt>
        )}
      </Card>

      {save.isError ? (
        <Txt variant="small" color="signal">
          {errorMessage(save.error)}
        </Txt>
      ) : null}
    </Screen>
  );
}
