import { Placeholder, Screen, ScreenHeader } from '@/components';

/** Telemetri — kanıt (Figma 08). */
export default function EvidenceScreen() {
  return (
    <Screen tab>
      <ScreenHeader
        overline="Ölçülebilir ilerleme"
        title="Telemetri"
        subtitle="Saat ilerleme değildir. Burada yalnızca hayatında neyin değiştiği sayılır."
      />
      <Placeholder figmaFrame="08 Telemetri — kanıt" />
    </Screen>
  );
}
