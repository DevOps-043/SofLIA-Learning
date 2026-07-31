import { logger as techDebtLogger } from '@/lib/utils/logger'
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
  stripBugReportTokens,
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
  chatProvenance: {
    assistant_message_id: string | null;
    conversation_id: string;
    user_message_id: string;
  } | null;
}

/**
 * El bloque oculto emitido por el modelo es la unica senal que decide si el
 * turno abre un borrador de reporte.
 *
 * Antes existia ademas un filtro por palabras clave sobre el mensaje del
 * usuario (`allowBugReportDraft`): si ese filtro no reconocia la frase, el
 * borrador que el modelo SI habia generado se borraba del historial y el flujo
 * de confirmacion quedaba muerto — el usuario confirmaba y el reporte nunca
 * llegaba a `reportes_problemas`. La deteccion semantica del modelo no puede
 * quedar subordinada a un regex de intencion.
 */
export async function processAIResponse(
  finalContent: string,
  body: LiaChatProcessingBody,
  requestContext: ChatRequest['context'],
  _request: { headers: { get: (key: string) => string | null } },
  previousDraft?: BugReportDraftTokenPayload | null
): Promise<ProcessedResponse> {
  const preparedDraftResponse = await prepareDraftResponseForPersistence({
    finalContent,
    body,
    requestContext,
    previousDraft,
  });

  const clientContent =
    preparedDraftResponse?.clientContent ?? stripBugReportTokens(finalContent);
  const assistantContentToPersist =
    preparedDraftResponse?.assistantContentToPersist ?? clientContent;

  if (body.conversationId && !isValidUUID(body.conversationId)) {
    techDebtLogger.warn(
      `conversationId invalido recibido (no es UUID): "${body.conversationId}" - se omite la persistencia del historial`
    );
  }

  const persistedTurn = await persistConversationTurn({
    conversationId: body.conversationId,
    userId: requestContext?.userId,
    requestContext,
    userMessage: body.messages[body.messages.length - 1],
    assistantContent: assistantContentToPersist,
  });

  return {
    clientContent,
    bugReportSaved: false,
    chatProvenance: persistedTurn
      ? {
          assistant_message_id: persistedTurn.assistantMessageId,
          conversation_id: persistedTurn.conversationId,
          user_message_id: persistedTurn.userMessageId,
        }
      : null,
  };
}
