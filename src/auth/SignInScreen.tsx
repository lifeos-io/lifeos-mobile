import { useState } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, Orbit, Txt } from '@/components';
import { colors, layout } from '@/theme';

import { signIn } from './session';

/** Shown in live mode until the user signs in with Keycloak. */
export function SignInScreen() {
  const insets = useSafeAreaInsets();
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  const start = async () => {
    setBusy(true);
    setFailed(false);
    try {
      await signIn();
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.space,
        paddingTop: insets.top + 48,
        paddingBottom: insets.bottom + 16,
        paddingHorizontal: layout.gutter,
        justifyContent: 'space-between',
      }}>
      <View style={{ gap: 12 }}>
        <Txt variant="overline" color="acid">
          Life OS
        </Txt>
        <Txt variant="displayXL" accessibilityRole="header">
          Rotana dön.
        </Txt>
        <Txt color="moonMid">Görevin, uyduların ve telemetrin seni bekliyor.</Txt>
      </View>

      <Orbit satellites={[]} showSelf height={220} />

      <View style={{ gap: 12 }}>
        {failed ? (
          <Txt variant="small" color="signal">
            Giriş yapılamadı. Bağlantıyı kontrol edip tekrar dene.
          </Txt>
        ) : null}
        <Button label={busy ? 'Bağlanıyor…' : 'Giriş yap'} disabled={busy} onPress={start} />
      </View>
    </View>
  );
}
