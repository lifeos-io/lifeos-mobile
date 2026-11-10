import { View } from 'react-native';

import { LockIcon } from './icons';
import { Txt } from './Txt';

/** What never goes into a record: company code and customer data. */
export function PrivacyNote() {
  return (
    <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
      <View style={{ paddingTop: 1 }}>
        <LockIcon size={16} color="moonMid" />
      </View>
      <Txt variant="small" color="moonMid" style={{ flex: 1 }}>
        Kurumsal kod ve müşteri verisi buraya girmez; kendi cümlenle özetle.
      </Txt>
    </View>
  );
}
