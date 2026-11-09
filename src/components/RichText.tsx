import { View } from 'react-native';

import { colors, type ColorToken } from '@/theme';

import { Txt } from './Txt';

/**
 * Kule's answers are plain text with a little markdown: blank lines between paragraphs, "- " bullets and
 * **bold**. Anything else shows as written.
 */
export function RichText({ text, color = 'moon' }: { text: string; color?: ColorToken }) {
  const blocks = text.split(/\n{2,}/);
  return (
    <View style={{ gap: 10 }}>
      {blocks.map((block, i) => {
        const lines = block.split('\n');
        if (lines.every((line) => line.startsWith('- '))) {
          return (
            <View key={i} style={{ gap: 6 }}>
              {lines.map((line, j) => (
                <View key={j} style={{ flexDirection: 'row', gap: 10 }}>
                  <View style={{ width: 3, borderRadius: 2, backgroundColor: colors.acid }} />
                  <Inline text={line.slice(2)} color={color} />
                </View>
              ))}
            </View>
          );
        }
        return <Inline key={i} text={lines.join('\n')} color={color} />;
      })}
    </View>
  );
}

function Inline({ text, color }: { text: string; color: ColorToken }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);
  return (
    <Txt color={color} style={{ flex: 1 }}>
      {parts.map((part, i) =>
        part.startsWith('**') && part.endsWith('**') ? (
          <Txt key={i} variant="bodyStrong" color={color}>
            {part.slice(2, -2)}
          </Txt>
        ) : (
          part
        ),
      )}
    </Txt>
  );
}
