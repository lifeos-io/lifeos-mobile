import { useEffect, useRef, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
  type ScrollViewInstance,
  type TextInputInstance,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useChat, useCurrentConversation, useMessages } from '@/api/hooks';
import { ApiError, type Message } from '@/api/types';
import { ArrowRightIcon, Card, LoadError, Loading, ScreenHeader, Txt, RichText } from '@/components';
import { colors, layout, typography } from '@/theme';

const MESSAGE_MAX = 4000;

/** Kule — the coach (Figma 11): ask, and the answer streams in from Coach. */
export default function CoachScreen() {
  const insets = useSafeAreaInsets();
  const conversation = useCurrentConversation();
  const messages = useMessages(conversation.data?.id);
  const chat = useChat(conversation.data?.id);
  const [draft, setDraft] = useState('');
  const [keyboard, setKeyboard] = useState(false);
  const scroll = useRef<ScrollViewInstance>(null);
  const input = useRef<TextInputInstance>(null);

  useEffect(() => {
    const show = Keyboard.addListener('keyboardWillShow', () => setKeyboard(true));
    const hide = Keyboard.addListener('keyboardWillHide', () => setKeyboard(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  const send = () => {
    const content = draft.trim();
    if (!content || chat.streaming) return;
    // Clearing the native field too: iOS would otherwise put a pending autocorrection back into it.
    input.current?.clear();
    setDraft('');
    chat.send(content);
  };

  const failed = conversation.isError || messages.isError;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1, backgroundColor: colors.space }}>
      <ScrollView
        ref={scroll}
        onContentSizeChange={() => scroll.current?.scrollToEnd({ animated: true })}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + layout.top,
          paddingHorizontal: layout.gutter,
          paddingBottom: layout.section,
          gap: 16,
        }}>
        <ScreenHeader overline="Kontrol kulesi" title="Sor. Cevap kayda bağlansın." accent="nebula" />

        {failed ? <LoadError onRetry={() => (conversation.isError ? conversation.refetch() : messages.refetch())} /> : null}
        {conversation.isPending || messages.isPending ? <Loading /> : null}

        {messages.data?.length === 0 && !chat.pending ? (
          <Txt color="moonMid">
            Bir karar, bir uydu ya da yeni bir bilgi yaz. Kule cevabını rotana, manevralarına ve telemetrine bakarak verir.
          </Txt>
        ) : null}

        {messages.data?.map((message) => <Bubble key={message.id} message={message} />)}

        {chat.pending ? (
          <>
            <Bubble message={{ role: 'USER', content: chat.pending.question }} />
            <Bubble message={{ role: 'ASSISTANT', content: chat.pending.answer }} streaming />
          </>
        ) : null}

        {chat.error && !(chat.error instanceof ApiError && chat.error.code === 'ABORTED') ? (
          <Card border="signal" fill="signalInk">
            <Txt variant="small">Kule şu an cevap veremedi. Biraz sonra tekrar dene.</Txt>
          </Card>
        ) : null}
      </ScrollView>

      <View
        style={{
          paddingHorizontal: layout.gutter,
          paddingTop: 8,
          paddingBottom: keyboard ? 8 : layout.tabBarClearance - 8,
        }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'flex-end',
            gap: 8,
            backgroundColor: colors.cabin,
            borderRadius: 26,
            borderWidth: 1,
            borderColor: colors.line,
            paddingLeft: 18,
            padding: 6,
          }}>
          <TextInput
            ref={input}
            value={draft}
            onChangeText={setDraft}
            maxLength={MESSAGE_MAX}
            multiline
            placeholder="Karar, uydu ya da yeni bilgi…"
            placeholderTextColor={colors.moonFaint}
            selectionColor={colors.acid}
            accessibilityLabel="Kule'ye mesaj"
            style={[
              typography.body,
              { flex: 1, color: colors.moon, maxHeight: 120, paddingTop: 10, paddingBottom: 10 },
            ]}
          />
          <Pressable
            onPress={chat.streaming ? chat.stop : send}
            disabled={!chat.streaming && !draft.trim()}
            accessibilityRole="button"
            accessibilityLabel={chat.streaming ? 'Cevabı durdur' : 'Gönder'}
            style={({ pressed }) => ({
              width: 40,
              height: 40,
              borderRadius: 20,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: colors.acid,
              opacity: !chat.streaming && !draft.trim() ? 0.4 : pressed ? 0.8 : 1,
            })}>
            {chat.streaming ? (
              <View style={{ width: 12, height: 12, borderRadius: 2, backgroundColor: colors.acidInk }} />
            ) : (
              <ArrowRightIcon color="acidInk" />
            )}
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

function Bubble({ message, streaming }: { message: Pick<Message, 'role' | 'content'>; streaming?: boolean }) {
  if (message.role === 'USER') {
    return (
      <View
        style={{
          alignSelf: 'flex-end',
          maxWidth: '85%',
          backgroundColor: colors.cabinRaised,
          borderRadius: 18,
          borderBottomRightRadius: 6,
          paddingHorizontal: 14,
          paddingVertical: 10,
        }}>
        <Txt>{message.content}</Txt>
      </View>
    );
  }
  return (
    <Card style={{ gap: 10 }} accessibilityLiveRegion={streaming ? 'polite' : undefined}>
      <Txt variant="overline" color="nebula">
        Kule
      </Txt>
      {message.content ? <RichText text={message.content} /> : <Typing />}
    </Card>
  );
}

/** Three dots while the first piece of the answer is on its way. */
function Typing() {
  return (
    <View style={{ flexDirection: 'row', gap: 6, paddingVertical: 6 }} accessibilityLabel="Kule yazıyor">
      {[0.9, 0.6, 0.3].map((opacity) => (
        <View key={opacity} style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.nebula, opacity }} />
      ))}
    </View>
  );
}
