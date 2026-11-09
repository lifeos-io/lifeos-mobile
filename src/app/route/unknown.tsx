import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';

import { useCreateKnowledgeItem, useMainGoal } from '@/api/hooks';
import type { KnowledgeKind } from '@/api/types';
import { Button, Card, Chips, Field, Screen, ScreenHeader, Toggle, Txt } from '@/components';
import { errorMessage } from '@/lib/errors';
import { goBack } from '@/lib/navigation';

const STATEMENT_MAX = 500;
const VERIFY_MAX = 1000;

const kinds = [
  {
    value: 'UNKNOWN',
    label: 'Bilinmeyen',
    placeholder: 'Kadro açma politikası ve zamanlama',
    hint: 'Cevabını bilmediğin, rotayı etkileyen bir soru.',
  },
  {
    value: 'ASSUMPTION',
    label: 'Varsayım',
    placeholder: 'Ekibin işi şu an Kubernetes gerektirmiyor',
    hint: 'Doğru kabul edip üzerine karar verdiğin ama doğrulamadığın bir şey.',
  },
] as const satisfies readonly { value: KnowledgeKind; label: string; placeholder: string; hint: string }[];

/**
 * A new unknown or assumption of the goal (the knowledge map): the route rests on it, Kule watches it, and a
 * maneuver can name it as an assumption. `kind=ASSUMPTION` opens on an assumption.
 */
export default function NewUnknownScreen() {
  const params = useLocalSearchParams<{ kind?: string }>();
  const goal = useMainGoal();
  const create = useCreateKnowledgeItem(goal.data?.id);
  const [kind, setKind] = useState<(typeof kinds)[number]['value']>(
    params.kind === 'ASSUMPTION' ? 'ASSUMPTION' : 'UNKNOWN',
  );
  const [statement, setStatement] = useState('');
  const [external, setExternal] = useState(params.kind !== 'ASSUMPTION');
  const [howToVerify, setHowToVerify] = useState('');
  const selected = kinds.find((option) => option.value === kind)!;

  const submit = () =>
    create.mutate(
      {
        statement: statement.trim(),
        kind,
        status: 'UNVERIFIED',
        external,
        source: null,
        howToVerify: howToVerify.trim() || null,
      },
      { onSuccess: () => goBack('/route') },
    );

  return (
    <Screen
      footer={
        <Button
          label="Haritaya ekle"
          disabled={!goal.data || !statement.trim() || !create.isIdle}
          onPress={submit}
        />
      }>
      <ScreenHeader
        back
        fallback="/route"
        overline="Bilinmeyenler"
        title="Neyi bilmiyorsun?"
        subtitle="Rotanın dayandığı ama emin olmadığın şeyler. Kule bunları izler."
      />
      <Chips
        label="Tür"
        options={kinds}
        value={kind}
        onChange={(next) => {
          setKind(next);
          // An unknown is usually someone else's call; an assumption usually the user's own.
          setExternal(next === 'UNKNOWN');
        }}
      />
      <Txt variant="small" color="moonMid">
        {selected.hint}
      </Txt>
      <Field
        label={selected.label}
        value={statement}
        onChangeText={setStatement}
        maxLength={STATEMENT_MAX}
        multiline
        autoFocus
        placeholder={selected.placeholder}
      />
      <Card style={{ gap: 2 }}>
        <Toggle label="Kontrolümün dışında" value={external} onChange={setExternal} />
        <Txt variant="small" color="moonFaint">
          İşverenin, ekibin ya da piyasanın elinde olan bir koşul.
        </Txt>
      </Card>
      <Field
        label="Nasıl öğrenirim? (isteğe bağlı)"
        value={howToVerify}
        onChangeText={setHowToVerify}
        maxLength={VERIFY_MAX}
        multiline
        placeholder="1:1'de yöneticime sor"
      />
      {create.isError ? (
        <Txt variant="small" color="signal">
          {errorMessage(create.error)}
        </Txt>
      ) : null}
    </Screen>
  );
}
