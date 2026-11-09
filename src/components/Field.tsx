import { TextInput, View, type TextInputProps } from 'react-native';

import { colors, layout, typography } from '@/theme';

import { Txt } from './Txt';

type FieldProps = Pick<
  TextInputProps,
  'value' | 'onChangeText' | 'maxLength' | 'multiline' | 'autoFocus' | 'placeholder' | 'onSubmitEditing'
> & {
  label: string;
  /** Under the input: a hint, or why the value is not accepted. */
  note?: string;
  invalid?: boolean;
};

/** A labelled text input on a card: the forms' one input. */
export function Field({ label, note, invalid = false, multiline, ...props }: FieldProps) {
  return (
    <View
      style={{
        backgroundColor: colors.cabin,
        borderRadius: layout.cardRadius,
        borderWidth: 1,
        borderColor: invalid ? colors.signal : colors.line,
        padding: layout.cardPadding,
        gap: 6,
      }}>
      <Txt variant="small" color="moonMid">
        {label}
      </Txt>
      <TextInput
        {...props}
        accessibilityLabel={label}
        multiline={multiline}
        placeholderTextColor={colors.moonFaint}
        selectionColor={colors.acid}
        style={[typography.cardTitle, { color: colors.moon, minHeight: multiline ? 88 : undefined, padding: 0 }]}
        textAlignVertical={multiline ? 'top' : 'center'}
      />
      {note ? (
        <Txt variant="small" color={invalid ? 'signal' : 'moonFaint'}>
          {note}
        </Txt>
      ) : null}
    </View>
  );
}
