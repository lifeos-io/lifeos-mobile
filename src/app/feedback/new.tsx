import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, View } from 'react-native';

import { useRecordFeedback } from '@/api/hooks';
import type { Feedback, FeedbackSourceKind, LocalDate, Reliability } from '@/api/types';
import { Button, Card, Chips, Field, PrivacyNote, Screen, ScreenHeader, Stepper, Txt } from '@/components';
import { errorMessage } from '@/lib/errors';
import { reliabilityLabels, sourceKindLabels } from '@/lib/evidence';
import { pastDay, today } from '@/lib/format';
import { goBack } from '@/lib/navigation';
import { addDays } from '@/lib/route';

const LABEL_MAX = 200;
const CONTENT_MAX = 4000;
const DAYS_BACK = 60;

const sourceKinds = (Object.keys(sourceKindLabels) as FeedbackSourceKind[]).map((kind) => ({
  value: kind,
  label: sourceKindLabels[kind],
}));
const reliabilities = (Object.keys(reliabilityLabels) as Reliability[]).map((r) => ({
  value: r,
  label: reliabilityLabels[r],
}));

/**
 * Geri bildirim kaydı — what someone said about the work: who, what, how much it can be trusted, when. Recorded
 * as is; Coach may turn it into a route revision. `from=evidence` goes back to the evidence being written, which
 * links it; otherwise the user may record the evidence it confirms right away.
 */
export default function NewFeedbackScreen() {
  const { from } = useLocalSearchParams<{ from?: string }>();
  const record = useRecordFeedback();
  const earliest = addDays(today(), -DAYS_BACK);

  const [sourceKind, setSourceKind] = useState<FeedbackSourceKind>('MANAGER');
  const [sourceLabel, setSourceLabel] = useState('');
  const [content, setContent] = useState('');
  const [reliability, setReliability] = useState<Reliability>('MEDIUM');
  const [receivedOn, setReceivedOn] = useState<LocalDate>(today());

  const done = (feedback: Feedback) => {
    if (from === 'evidence') {
      goBack('/evidence');
      return;
    }
    Alert.alert('Geri bildirim kaydedildi', 'Bir çıktıyı ya da sonucu teyit ediyorsa telemetri olarak da kaydet.', [
      { text: 'Sonra', style: 'cancel', onPress: () => goBack('/evidence') },
      {
        text: 'Telemetri kaydet',
        onPress: () => router.replace({ pathname: '/evidence/new', params: { feedbackId: feedback.id } }),
      },
    ]);
  };

  const submit = () =>
    record.mutate(
      {
        sourceKind,
        sourceLabel: sourceLabel.trim() || null,
        content: content.trim(),
        reliability,
        receivedOn,
      },
      { onSuccess: done },
    );

  return (
    <Screen
      footer={
        <Button label="Geri bildirimi kaydet" disabled={!content.trim() || !record.isIdle} onPress={submit} />
      }>
      <ScreenHeader
        back
        fallback="/evidence"
        overline="Geri bildirim kaydı"
        title="Ne söylendi?"
        subtitle="Olduğu gibi yaz; yorumunu değil, duyduğunu."
      />

      <View style={{ gap: 10 }}>
        <Txt variant="overline" color="moonMid">
          Kimden
        </Txt>
        <Chips label="Kaynak" options={sourceKinds} value={sourceKind} onChange={setSourceKind} />
      </View>
      <Field
        label="Kim? (isteğe bağlı)"
        value={sourceLabel}
        onChangeText={setSourceLabel}
        maxLength={LABEL_MAX}
        placeholder="Takım lideri"
      />
      <Field
        label="Geri bildirim"
        value={content}
        onChangeText={setContent}
        maxLength={CONTENT_MAX}
        multiline
        placeholder="Teknik olarak iyisin ama domain bilgini güçlendirmelisin."
      />

      <View style={{ gap: 10 }}>
        <Txt variant="overline" color="moonMid">
          Ne kadar güvenilir?
        </Txt>
        <Chips label="Güvenilirlik" options={reliabilities} value={reliability} onChange={setReliability} />
        <Txt variant="small" color="moonFaint">
          İşini doğrudan gördü mü, konuyu biliyor mu? Tek bir yorum da olabilir, tekrar eden bir gözlem de.
        </Txt>
      </View>

      <Card style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Txt variant="overline" color="moonMid">
          Ne zaman
        </Txt>
        <Stepper
          label="Tarih"
          value={pastDay(receivedOn)}
          onStep={(delta) => setReceivedOn((d) => addDays(d, delta))}
          canDecrease={receivedOn > earliest}
          canIncrease={receivedOn < today()}
        />
      </Card>
      <PrivacyNote />

      {record.isError ? (
        <Txt variant="small" color="signal">
          {errorMessage(record.error)}
        </Txt>
      ) : null}
    </Screen>
  );
}
