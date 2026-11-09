import { useState } from 'react';

import { useCaptureIdea, useMainGoal } from '@/api/hooks';
import { Button, Field, Screen, ScreenHeader, Txt } from '@/components';
import { errorMessage } from '@/lib/errors';
import { goBack } from '@/lib/navigation';

const TITLE_MAX = 200;
const NOTE_MAX = 4000;

/** Launch a new satellite: capture an idea into the inbox, linked to the main goal. */
export default function NewIdeaScreen() {
  const goal = useMainGoal();
  const capture = useCaptureIdea();
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  // Locked once saved too: the screen is on its way out and must not capture the idea twice.
  const ready = title.trim().length > 0 && capture.isIdle;

  const submit = () =>
    capture.mutate(
      { title: title.trim(), note: note.trim() || null, goalId: goal.data?.id ?? null },
      { onSuccess: () => goBack('/ideas') },
    );

  return (
    <Screen footer={<Button label="Yörüngeye fırlat" disabled={!ready} onPress={submit} />}>
      <ScreenHeader
        back
        fallback="/ideas"
        overline="Yeni uydu"
        title="Aklındaki fikir ne?"
        subtitle="Rotanı değiştirmez; yer kontrolünde değerlendirilir."
      />
      <Field label="Fikir" value={title} onChangeText={setTitle} maxLength={TITLE_MAX} autoFocus />
      <Field
        label="Nereden çıktı? (isteğe bağlı)"
        value={note}
        onChangeText={setNote}
        maxLength={NOTE_MAX}
        multiline
      />
      {capture.isError ? (
        <Txt variant="small" color="signal">
          {errorMessage(capture.error)}
        </Txt>
      ) : null}
    </Screen>
  );
}
