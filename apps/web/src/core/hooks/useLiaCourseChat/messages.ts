import type { SofLIAMessage } from '../../types/lia.types';
import type { LoadedLiaMessage } from './types';

export function normalizeCourseMessage(message: string): string {
  return message.trim();
}

export function createMessageId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function createInitialCourseMessages(
  initialMessage?: string | null
): SofLIAMessage[] {
  if (!initialMessage) {
    return [];
  }

  return [
    {
      id: 'initial',
      role: 'assistant',
      content: initialMessage,
      timestamp: new Date(),
    },
  ];
}

export function createUserMessage(content: string): SofLIAMessage {
  return {
    id: createMessageId(),
    role: 'user',
    content,
    timestamp: new Date(),
  };
}

export function createAssistantErrorMessage(): SofLIAMessage {
  return {
    id: createMessageId(),
    role: 'assistant',
    content:
      'Lo siento, ocurrió un error al procesar tu mensaje. Por favor, intenta de nuevo.',
    timestamp: new Date(),
  };
}

export function formatLoadedMessages(
  messages?: LoadedLiaMessage[]
): SofLIAMessage[] {
  return (messages || []).map((message) => ({
    id: message.id,
    role: message.role,
    content: message.content,
    timestamp: new Date(message.timestamp),
    attachments: message.attachments,
  }));
}

export function buildRequestMessages(
  history: SofLIAMessage[],
  currentMessage: string
) {
  return [
    ...history.map((entry) => ({
      role: entry.role,
      content: entry.content,
    })),
    {
      role: 'user',
      content: currentMessage,
    },
  ];
}
