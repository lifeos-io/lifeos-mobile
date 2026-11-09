import * as db from './mock/coach';
import { respond } from './mock/respond';
import { ApiError, type Conversation, type Message, type Uuid } from './types';

/*
 * The Coach service's conversation endpoints, answered from the mock. Connecting the app reads the real stream
 * with `expo/fetch` (it streams response bodies): `event: delta` → onDelta(text), `event: done` → the stored
 * message, `event: error` → ApiError(code); `:ping` comments are skipped.
 */

function randomId(): Uuid {
  const hex = () => Math.floor(Math.random() * 16).toString(16);
  return 'xxxxxxxx-xxxx-7xxx-8xxx-xxxxxxxxxxxx'.replace(/x/g, hex);
}

/** GET /api/coach/conversations: most recently active first. */
export function listConversations(): Promise<Conversation[]> {
  return respond([...db.conversations].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)));
}

/** POST /api/coach/conversations {title} → 201 */
export function startConversation(title?: string): Promise<Conversation> {
  const now = new Date().toISOString();
  const conversation = { id: randomId(), title: title ?? 'Kule', createdAt: now, updatedAt: now };
  db.conversations.push(conversation);
  return respond(conversation);
}

/** GET /api/coach/conversations/{conversationId}/messages: oldest first. */
export function listMessages(conversationId: Uuid): Promise<Message[]> {
  return respond(
    db.messages
      .filter((m) => m.conversationId === conversationId)
      .map(({ conversationId: _conversationId, ...message }) => message),
  );
}

type StreamOptions = {
  onDelta: (text: string) => void;
  signal?: AbortSignal;
};

/**
 * POST /api/coach/conversations/{conversationId}/messages {content}, text/event-stream. Resolves with the stored
 * answer (`done`); rejects with ApiError on `error` or when aborted. The user's message is stored first.
 */
export async function sendMessage(
  conversationId: Uuid,
  content: string,
  { onDelta, signal }: StreamOptions,
): Promise<Message> {
  const conversation = db.conversations.find((c) => c.id === conversationId);
  if (!conversation) throw new ApiError('NOT_FOUND', 'Conversation not found.');
  const now = new Date().toISOString();
  db.messages.push({ id: randomId(), conversationId, role: 'USER', content, createdAt: now });

  const answer = db.cannedAnswer(content);
  // Pieces of a few words, like a model's stream.
  const pieces = answer.match(/\S+\s*/g) ?? [answer];
  await pause(500, signal);
  for (let i = 0; i < pieces.length; i += 3) {
    onDelta(pieces.slice(i, i + 3).join(''));
    await pause(60, signal);
  }
  const message: Message = { id: randomId(), role: 'ASSISTANT', content: answer, createdAt: new Date().toISOString() };
  db.messages.push({ ...message, conversationId });
  conversation.updatedAt = message.createdAt;
  return message;
}

function pause(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(new ApiError('ABORTED', 'Stopped.'));
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener('abort', () => {
      clearTimeout(timer);
      reject(new ApiError('ABORTED', 'Stopped.'));
    });
  });
}
