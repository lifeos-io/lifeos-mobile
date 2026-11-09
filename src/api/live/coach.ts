import type { StreamOptions } from '../mock/coach';
import { ApiError, type Conversation, type Message, type Uuid } from '../types';

import { q, request, send } from './http';

/** The Coach service through the gateway (`/api/coach/**`); same signatures as `../mock/coach.ts`. */

const C = '/api/coach/conversations';

export function listConversations(): Promise<Conversation[]> {
  return request('GET', C);
}

export function startConversation(title?: string): Promise<Conversation> {
  return request('POST', C, { body: { title: title ?? 'Kule' } });
}

export function listMessages(conversationId: Uuid): Promise<Message[]> {
  return request('GET', `${C}/${q(conversationId)}/messages`);
}

/**
 * Sends a message and reads the answer's event stream: `delta` {text} pieces, then `done` with the stored message,
 * or `error` {code, detail}. Comment lines (`: ping`) are skipped.
 */
export async function sendMessage(
  conversationId: Uuid,
  content: string,
  { onDelta, signal }: StreamOptions,
): Promise<Message> {
  const response = await send('POST', `${C}/${q(conversationId)}/messages`, {
    body: { content },
    accept: 'text/event-stream',
    signal,
  });
  if (!response.body) {
    throw new ApiError('NETWORK', 'The answer could not be read.');
  }
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      // Events end with a blank line.
      let end: number;
      while ((end = buffer.search(/\r?\n\r?\n/)) >= 0) {
        const raw = buffer.slice(0, end);
        buffer = buffer.slice(end).replace(/^\r?\n\r?\n/, '');
        const event = parseEvent(raw);
        if (!event) continue;
        if (event.name === 'delta') {
          onDelta((JSON.parse(event.data) as { text: string }).text);
        } else if (event.name === 'done') {
          return JSON.parse(event.data) as Message;
        } else if (event.name === 'error') {
          const failure = JSON.parse(event.data) as { code: string; detail: string };
          throw new ApiError(failure.code, failure.detail);
        }
      }
    }
  } catch (e) {
    if (signal?.aborted) throw new ApiError('ABORTED', 'Stopped.');
    throw e;
  } finally {
    reader.releaseLock();
  }
  throw new ApiError('NETWORK', 'The answer stopped before it was complete.');
}

/** One server-sent event: its name and data lines; null for a comment-only block. */
function parseEvent(raw: string): { name: string; data: string } | null {
  let name = 'message';
  const data: string[] = [];
  for (const line of raw.split(/\r?\n/)) {
    if (line.startsWith(':')) continue;
    const colon = line.indexOf(':');
    const field = colon < 0 ? line : line.slice(0, colon);
    const value = colon < 0 ? '' : line.slice(colon + 1).replace(/^ /, '');
    if (field === 'event') name = value;
    if (field === 'data') data.push(value);
  }
  return data.length ? { name, data: data.join('\n') } : null;
}
