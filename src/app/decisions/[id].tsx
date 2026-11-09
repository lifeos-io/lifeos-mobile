import { Placeholder, Screen, ScreenHeader } from '@/components';

/** Manevra kaydı — a decision (Figma 07). */
export default function DecisionScreen() {
  return (
    <Screen>
      <ScreenHeader
        back
        accent="moonMid"
        overline="Manevra kaydı"
        title="Kubernetes'i park et, OAuth 2.0'a odaklan"
      />
      <Placeholder figmaFrame="07 Manevra kaydı — karar" />
    </Screen>
  );
}
