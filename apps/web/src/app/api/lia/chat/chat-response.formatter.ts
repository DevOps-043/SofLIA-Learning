/**
 * Chat Response Formatter
 *
 * Handles post-processing of LIA's raw AI response:
 *  - Detects embedded draft tokens for bug reports and normalizes them
 *  - Persists the conversation history
 *  - Returns the clean client-facing content string
 */

import type { ChatRequest } from './platform-context.service';
import {
  prepareDraftResponseForPersistence,
  type BugReportDraftTokenPayload,
  type LiaChatProcessingBody,
} from './lia-report-workflow.service';
import {
  isValidUUID,
  persistConversationTurn,
} from './lia-chat-history.service';

export interface ProcessedResponse {
  clientContent: string;
  bugReportSaved: boolean;
}

export async function processAIResponse(
  finalContent: string,
  body: LiaChatProcessingBody,
  requestContext: ChatRequest['context'],
  _request: { headers: { get: (key: string) => string | null } },
  previousDraft?: BugReportDraftTokenPayload | null
): Promise<ProcessedResponse> {
  let clientContent = finalContent;
  let assistantContentToPersist = finalContent;

  const preparedDraftResponse = await prepareDraftResponseForPersistence({
    finalContent,
    body,
    requestContext,
    previousDraft,
  });

  if (preparedDraftResponse) {
    clientContent = preparedDraftResponse.clientContent;
    assistantContentToPersist = preparedDraftResponse.assistantContentToPersist;
  }

  if (body.conversationId && !isValidUUID(body.conversationId)) {
    console.warn(
      `conversationId invalido recibido (no es UUID): "${body.conversationId}" - se omite la persistencia del historial`
    );
  }

  await persistConversationTurn({
    conversationId: body.conversationId,
    userId: requestContext?.userId,
    requestContext,
    userMessage: body.messages[body.messages.length - 1],
    assistantContent: assistantContentToPersist,
  });

  return { clientContent, bugReportSaved: false };
}
