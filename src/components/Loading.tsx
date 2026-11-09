import { ActivityIndicator, View } from 'react-native';

import { colors } from '@/theme';

import { Card } from './Card';
import { Txt } from './Txt';

/** While a screen's data is on its way. */
export function Loading() {
  return (
    <View style={{ paddingVertical: 48, alignItems: 'center' }}>
      <ActivityIndicator color={colors.acid} />
    </View>
  );
}

/** When the data could not be loaded. */
export function LoadError({ onRetry }: { onRetry?: () => void }) {
  return (
    <Card border="signal" fill="signalInk">
      <Txt variant="bodyStrong">Veri yüklenemedi.</Txt>
      {onRetry ? (
        <Txt variant="small" color="signal" onPress={onRetry} style={{ marginTop: 6 }}>
          Tekrar dene
        </Txt>
      ) : null}
    </Card>
  );
}
