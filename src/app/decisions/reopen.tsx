import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';

import { useChangeDecision, useDecision } from '@/api/hooks';
import { Button, Card, Field, LoadError, Loading, Screen, ScreenHeader, Txt } from '@/components';
import { errorMessage } from '@/lib/errors';

const REASON_MAX = 2000;

/**
 * Yeniden aç — a decided maneuver weighed again: a new draft with the same options and assumptions. The original
 * stays in force until the new draft is decided.
 */
export default function ReopenDecisionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const decision = useDecision(id);
  const { reopen } = useChangeDecision(id);
  const [reason, setReason] = useState('');

  if (decision.isError || decision.isPending) {
    return (
      <Screen>
        <ScreenHeader back accent="moonMid" overline="Yeniden aç" title="" />
        {decision.isError ? <LoadError onRetry={() => decision.refetch()} /> : <Loading />}
      </Screen>
    );
  }
  const submit = () =>
    reopen.mutate(reason.trim(), {
      onSuccess: (draft) => router.replace({ pathname: '/decisions/edit', params: { id: draft.id } }),
    });

  return (
    <Screen
      footer={<Button label="Yeniden aç" disabled={!reason.trim() || !reopen.isIdle} onPress={submit} />}>
      <ScreenHeader back accent="moonMid" overline="Yeniden aç" title={decision.data.title} />
      <Field
        label="Ne değişti?"
        value={reason}
        onChangeText={setReason}
        maxLength={REASON_MAX}
        multiline
        autoFocus
        placeholder="Varsayım yanlışlandı: ekipte K8s ihtiyacı çıktı."
      />
      <Card border="nebula" fill="nebulaInk">
        <Txt variant="small">
          Aynı seçenek ve varsayımlarla yeni bir taslak açılır. Eski karar, yenisine karar verene kadar geçerli kalır.
        </Txt>
      </Card>
      {reopen.isError ? (
        <Txt variant="small" color="signal">
          {errorMessage(reopen.error)}
        </Txt>
      ) : null}
    </Screen>
  );
}
