import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { useChangeDecision, useDecision } from '@/api/hooks';
import type { WouldDecideAgain } from '@/api/types';
import { Button, Chips, Field, LoadError, Loading, Screen, ScreenHeader, Txt } from '@/components';
import { wouldDecideAgainLabels } from '@/lib/decision';
import { errorMessage } from '@/lib/errors';
import { goBack } from '@/lib/navigation';

const NOTE_MAX = 4000;
const verdicts = (Object.keys(wouldDecideAgainLabels) as WouldDecideAgain[]).map((value) => ({
  value,
  label: wouldDecideAgainLabels[value],
}));

/** Manevrayı kapat — an OPEN decision closed with what came of it and whether it would be made again. */
export default function CloseDecisionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const decision = useDecision(id);
  const { close } = useChangeDecision(id);
  const [note, setNote] = useState('');
  const [verdict, setVerdict] = useState<WouldDecideAgain>('YES');

  if (decision.isError || decision.isPending) {
    return (
      <Screen>
        <ScreenHeader back accent="moonMid" overline="Manevrayı kapat" title="" />
        {decision.isError ? <LoadError onRetry={() => decision.refetch()} /> : <Loading />}
      </Screen>
    );
  }
  const d = decision.data;
  const submit = () =>
    close.mutate(
      { version: d.version, outcomeNote: note.trim(), wouldDecideAgain: verdict },
      { onSuccess: () => goBack() },
    );

  return (
    <Screen
      footer={
        <Button
          label="Manevrayı kapat"
          disabled={d.status !== 'OPEN' || !note.trim() || !close.isIdle}
          onPress={submit}
        />
      }>
      <ScreenHeader
        back
        accent="moonMid"
        overline="Manevrayı kapat"
        title={d.title}
        subtitle={d.expectedOutcome ? `Beklenen: ${d.expectedOutcome}` : undefined}
      />
      <Field
        label="Ne oldu?"
        value={note}
        onChangeText={setNote}
        maxLength={NOTE_MAX}
        multiline
        autoFocus
        placeholder="Rıza akışını bulup PR'da gerekçeli yorum yaptım; K8s ihtiyacı çıkmadı."
      />
      <View style={{ gap: 10 }}>
        <Txt variant="overline" color="moonMid">
          Bugün yine aynı kararı verir miydin?
        </Txt>
        <Chips label="Yine aynı kararı verir miydin" options={verdicts} value={verdict} onChange={setVerdict} />
        <Txt variant="small" color="moonFaint">
          Sonuç kötü olsa da karar doğru olabilir; ikisini ayrı tut.
        </Txt>
      </View>
      {close.isError ? (
        <Txt variant="small" color="signal">
          {errorMessage(close.error)}
        </Txt>
      ) : null}
    </Screen>
  );
}
