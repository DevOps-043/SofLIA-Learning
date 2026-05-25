import type { LiaChatResponsePayload, LoadedLiaMessage } from './types';

export async function postLiaCourseMessage(
  body: unknown,
  signal: AbortSignal
): Promise<LiaChatResponsePayload> {
  const response = await fetch('/api/lia/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  });

  if (!response.ok) {
    throw new Error('Error en la comunicación con SofLIA');
  }

  return (await response.json()) as LiaChatResponsePayload;
}

export async function fetchLiaConversationMessages(
  conversationId: string
): Promise<LoadedLiaMessage[]> {
  const response = await fetch(`/api/lia/conversations/${conversationId}/messages`);

  if (!response.ok) {
    const errorData = await response
      .json()
      .catch(() => ({ error: 'Error desconocido' }));
    throw new Error(errorData.error || 'Error cargando conversación');
  }

  const data = (await response.json()) as { messages?: LoadedLiaMessage[] };
  return data.messages || [];
}

export async function endLiaConversation(
  conversationId: string,
  completed: boolean
): Promise<void> {
  await fetch('/api/lia/end-conversation', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ conversationId, completed }),
  });
}

export function sendLiaConversationBeacon(
  conversationId: string,
  completed: boolean
): void {
  if (typeof navigator === 'undefined' || !navigator.sendBeacon) {
    return;
  }

  navigator.sendBeacon(
    '/api/lia/end-conversation',
    JSON.stringify({ conversationId, completed })
  );
}
