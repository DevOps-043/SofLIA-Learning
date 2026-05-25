import type { Dispatch, SetStateAction } from 'react';
import type { SofLIAMessage } from '../../types/lia.types';
import { createMessageId } from './messages';
import type { LiaChatResponsePayload } from './types';

export function appendAssistantResponse(
  data: LiaChatResponsePayload,
  setMessages: Dispatch<SetStateAction<SofLIAMessage[]>>
): void {
  const responseText = data.message?.content || data.response;

  if (!responseText) {
    return;
  }

  setMessages((prev) => [
    ...prev,
    {
      id: createMessageId(),
      role: 'assistant',
      content: responseText,
      timestamp: new Date(),
      generatedNanoBanana: data.generatedNanoBanana,
      attachments: data.message?.attachments,
    },
  ]);
}
