import { NextRequest, NextResponse } from 'next/server';
import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
  type Part,
} from '@google/generative-ai';
import { apiError } from '@/lib/api/errors';
import { withZodBody } from '@/lib/api/with-validation';
import {
  buildSanitizedContextExcerpt,
  sanitizeContextPayload,
  sanitizeUntrustedString,
} from '@/lib/security/context-sanitizer';
import {
  buildSecurityRefusalMessage,
  buildPromptInjectionGuardrailPrompt,
  enforceSecurityResponsePolicy,
  evaluatePromptInjectionRisk,
} from '@/lib/security/prompt-injection-detector';
import { recordSecurityEvent } from '@/lib/security/security-events';
import {
  fetchPlatformContext,
  type ChatMessage,
  type ChatRequest,
  type PlatformContext,
} from './platform-context.service';
import { resolveActiveOrganizationContext } from './organization-context.service';
import { getLIASystemPrompt } from './system-prompt.service';
import {
  buildFullContext,
  appendPersonalizationPrompt,
  appendBugReportContext,
  buildCleanHistory,
} from './chat-context.builder';
import { buildCurrentTurnPrompt } from './prompt-current-turn.service';
import { processAIResponse } from './chat-response.formatter';
import { toInlineImagePart } from '@/core/reporting/report-problem.server';
import {
  CIRCUIT_BREAKER_DEFAULTS,
  executeWithCircuitBreaker,
} from '@/lib/resilience/circuit-breaker';
import { resolveGeminiModel } from '@/lib/gemini/client';
import { getAiModelSettings } from '@/lib/ai/model-settings/ai-model-settings.server.service';
import { buildManagedGenerationConfig } from '@/lib/ai/model-settings/generation-config';
import { logger } from '@/lib/logger';
import {
  BUG_REPORT_CONFIRMATION_REMINDER,
  buildPendingBugReportPromptSection,
  containsBugReportToken,
  createBugReportTokenStreamMask,
  detectBugReportConfirmationIntent,
  extractBugReportDraftToken,
  prepareDraftResponseForPersistence,
  requestsBugReportConfirmation,
  stripBugReportTokens,
  submitConfirmedBugReport,
  type LiaChatProcessingBody,
} from './lia-report-workflow.service';
import type { ChatSession } from '@google/generative-ai';
import {
  getLatestAssistantMessageContent,
  persistConversationTurn,
} from './lia-chat-history.service';
import { detectTechnicalBugReportIntent } from './bug-report-intent.service';
import {
  buildSuperadminPromptSections,
  finalizeSuperadminResponse,
  resolveSuperadminTurn,
} from './superadmin/superadmin-turn';
import { hasActionBlock, stripActionTokens } from './superadmin/actions';
import { liaChatSchema, type LiaChatBody } from '../_schemas';
import { SessionService } from '@/features/auth/services/session.service';

type SecurityAssessment = ReturnType<typeof evaluatePromptInjectionRisk>;

function buildCurrentMessageParts(
  promptWithContext: string,
  attachments: ChatRequest['messages'][number]['attachments']
): Part[] {
  const parts: Part[] = [{ text: promptWithContext }];

  if (!attachments?.length) {
    return parts;
  }

  parts.push({
    text:
      'El usuario adjunto evidencia visual. Usa las imagenes como contexto para entender mejor el problema o la pregunta.',
  });

  attachments.forEach((attachment) => {
    const imagePart = toInlineImagePart(attachment);

    if (imagePart) {
      parts.push(imagePart);
    }
  });

  return parts;
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

function buildAssistantStreamResponse(content: string): Response {
  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    start(controller) {
      const chunkSize = 50;
      let index = 0;

      function push() {
        if (index >= content.length) {
          controller.enqueue(
            encoder.encode(
              'data: ' + JSON.stringify({ done: true }) + '\n\n'
            )
          );
          controller.close();
          return;
        }

        const chunk = content.slice(index, index + chunkSize);
        controller.enqueue(
          encoder.encode(
            'data: ' + JSON.stringify({ content: chunk, done: false }) + '\n\n'
          )
        );
        index += chunkSize;
        setTimeout(push, 10);
      }

      push();
    },
  });

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}

function buildAssistantResponse(
  content: string,
  shouldStream: boolean,
  chatProvenance?: {
    assistant_message_id: string | null;
    conversation_id: string;
    user_message_id: string;
  } | null,
) {
  if (shouldStream) {
    return buildAssistantStreamResponse(content);
  }

  return NextResponse.json({
    chat_provenance: chatProvenance || undefined,
    message: { role: 'assistant', content },
  });
}

/**
 * Persiste y asegura (defensa en profundidad) el texto COMPLETO ya emitido por
 * streaming. La protección primaria contra inyección ocurre ANTES de generar
 * (bloqueo pre-generación); aquí solo se aplica la política de seguridad sobre
 * el contenido que se guarda. Best-effort: un fallo de persistencia no debe
 * afectar la respuesta ya entregada al usuario.
 *
 * Si el modelo abrió un borrador de reporte técnico, el bloque oculto se
 * normaliza y se GUARDA (nunca se descarta): es lo que permite que el turno
 * siguiente reconozca la confirmación del usuario y envíe el reporte. El bloque
 * no llega a pantalla — lo enmascara `createBugReportTokenStreamMask` — y la
 * lectura del historial vuelve a filtrarlo.
 */
async function finalizeStreamedAssistantResponse(params: {
  fullText: string;
  body: LiaChatBody;
  requestContext: ChatRequest['context'];
  securityAssessment: SecurityAssessment;
}): Promise<void> {
  const { fullText, body, requestContext, securityAssessment } = params;
  try {
    // El cuerpo validado por Zod usa `passthrough`, por lo que su tipo inferido
    // no coincide nominalmente con la interfaz del flujo de reportes aunque la
    // forma sea la misma: se reconstruye solo lo que ese flujo necesita.
    const draftBody: LiaChatProcessingBody = {
      conversationId: body.conversationId,
      context: requestContext,
      enrichedMetadata: body.enrichedMetadata,
      isBugReport: body.isBugReport,
      messages: body.messages as ChatMessage[],
    };
    const preparedDraft = await prepareDraftResponseForPersistence({
      finalContent: fullText,
      body: draftBody,
      requestContext,
    });
    const contentToPersist =
      preparedDraft?.assistantContentToPersist ?? stripBugReportTokens(fullText);
    const secured = enforceSecurityResponsePolicy({
      content: contentToPersist,
      assessment: securityAssessment,
    });

    await persistConversationTurn({
      conversationId: body.conversationId,
      userId: requestContext?.userId,
      requestContext,
      userMessage: body.messages[body.messages.length - 1],
      assistantContent: secured,
    });
  } catch (persistError) {
    logger.error('LIA chat: fallo al finalizar respuesta en streaming', persistError);
  }
}

/**
 * Streaming REAL de Gemini: emite cada fragmento de texto al cliente conforme el
 * modelo lo genera (TTFT de ~1-2 s en lugar de esperar toda la respuesta). La
 * persistencia y la política de seguridad se aplican al cerrar.
 *
 * Se usa en el flujo común, pero el flujo común puede convertirse en un reporte
 * técnico en cualquier turno: el modelo decide abrir el borrador aunque el
 * usuario no haya usado la palabra "error". Por eso el stream enmascara el
 * bloque oculto en lugar de descartarlo y garantiza la petición de confirmación
 * al cierre.
 */
async function streamGeminiResponse(params: {
  chatSession: ChatSession;
  parts: Part[];
  body: LiaChatBody;
  requestContext: ChatRequest['context'];
  securityAssessment: SecurityAssessment;
}): Promise<Response> {
  const { chatSession, parts, body, requestContext, securityAssessment } = params;

  const encoder = new TextEncoder();
  // `fullText` conserva la salida CRUDA del modelo (con el bloque oculto de
  // reporte si lo hubo) porque es lo que se persiste; `visibleText` es lo que
  // realmente vio el usuario y define si hay que pedirle la confirmación.
  let fullText = '';
  let visibleText = '';
  const tokenMask = createBugReportTokenStreamMask();

  const readable = new ReadableStream({
    async start(controller) {
      const emit = (text: string) => {
        if (!text) return;
        visibleText += text;
        controller.enqueue(
          encoder.encode('data: ' + JSON.stringify({ content: text, done: false }) + '\n\n'),
        );
      };

      try {
        const streamResult = await executeWithCircuitBreaker(
          'gemini-lia-chat',
          () => chatSession.sendMessageStream(parts),
          CIRCUIT_BREAKER_DEFAULTS.gemini,
        );

        for await (const chunk of streamResult.stream) {
          const piece = chunk.text();
          if (!piece) continue;
          fullText += piece;
          emit(tokenMask.push(piece));
        }
      } catch (streamError) {
        logger.error('LIA chat: error durante el streaming de Gemini', streamError);
        if (!fullText) {
          const fallback =
            'En este momento no puedo responder por un problema temporal del servicio de IA. ' +
            'Por favor intenta de nuevo en unos minutos.';
          fullText = fallback;
          emit(fallback);
        }
      } finally {
        emit(tokenMask.flush());

        // El modelo abrió un borrador de reporte: el usuario debe poder
        // confirmarlo o corregirlo, así que la petición de confirmación se
        // garantiza igual que en el flujo sin streaming.
        if (
          containsBugReportToken(fullText) &&
          !requestsBugReportConfirmation(visibleText)
        ) {
          emit(`\n\n${BUG_REPORT_CONFIRMATION_REMINDER}`);
        }

        controller.enqueue(encoder.encode('data: ' + JSON.stringify({ done: true }) + '\n\n'));
        controller.close();
        void finalizeStreamedAssistantResponse({
          fullText,
          body,
          requestContext,
          securityAssessment,
        });
      }
    },
  });

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}

function isGeminiAccessConfigurationError(errorMessage: string): boolean {
  const normalizedMessage = errorMessage.toLowerCase();
  return (
    errorMessage.includes('403') ||
    normalizedMessage.includes('forbidden') ||
    normalizedMessage.includes('dunning') ||
    normalizedMessage.includes('billing') ||
    normalizedMessage.includes('permission denied')
  );
}

// ============================================
// API HANDLER
// ============================================
async function handlePost(
  request: NextRequest,
  body: LiaChatBody,
  _context: unknown,
) {

  let shouldStream = true;

  try {
    const { messages, context: requestContext, stream = true } = body;
    shouldStream = stream;

    // Verify API Key
    const googleApiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
    if (!googleApiKey) {
      logger.error('GEMINI_API_KEY no esta configurada');
      return apiError(
        'GEMINI_API_KEY_MISSING',
        'GEMINI_API_KEY no esta configurada',
        500,
      );
    }

    const sanitizedMessages = messages.map((entry) => ({
      ...entry,
      content: sanitizeUntrustedString(entry.content, 12000),
    }));
    const sanitizedRequestContext = requestContext
      ? sanitizeContextPayload(requestContext)
      : requestContext;

    // Atribución autoritativa del usuario desde la sesión del servidor.
    // No se confía en `context.userId` del cliente: si llega vacío, el turno NO
    // se persistía (uso de SofLIA sin contabilizar en las estadísticas); si se
    // falsifica, se atribuía a otro usuario. Tomamos el id de la sesión real y,
    // como respaldo, conservamos el del cliente si no hay sesión disponible.
    const sessionUser = await SessionService.getCurrentUser().catch(() => null);
    const authoritativeUserId =
      sessionUser?.id ||
      (typeof sanitizedRequestContext?.userId === 'string'
        ? sanitizedRequestContext.userId
        : undefined);
    if (sanitizedRequestContext && authoritativeUserId) {
      sanitizedRequestContext.userId = authoritativeUserId;
    }

    const sanitizedLastMessage = sanitizedMessages[sanitizedMessages.length - 1];
    const securityAssessment = evaluatePromptInjectionRisk({
      message: sanitizedLastMessage?.content || '',
      contextExcerpt: buildSanitizedContextExcerpt(sanitizedRequestContext),
    });

    if (securityAssessment.action === 'block') {
      recordSecurityEvent('prompt-injection-blocked', {
        pathname: request.nextUrl.pathname,
        method: request.method,
        userAgent: request.headers.get('user-agent') || undefined,
        ip:
          request.headers.get('cf-connecting-ip') ||
          request.headers.get('x-forwarded-for') ||
          undefined,
        reasons: securityAssessment.reasons,
        metadata: {
          score: securityAssessment.score,
          categories: securityAssessment.categories,
        },
      });

      return buildAssistantResponse(
        buildSecurityRefusalMessage(securityAssessment),
        shouldStream
      );
    }

    // Build enriched context
    const activeOrganizationContext = await resolveActiveOrganizationContext({
      userId: sanitizedRequestContext?.userId,
      requestedOrganizationId:
        typeof sanitizedRequestContext?.organizationId === 'string'
          ? sanitizedRequestContext.organizationId
          : undefined,
      currentPage: sanitizedRequestContext?.currentPage,
    });
    const platformContext = await fetchPlatformContext({
      userId: sanitizedRequestContext?.userId,
      organizationContext: activeOrganizationContext,
    });
    const fullContext: PlatformContext = await buildFullContext(platformContext, sanitizedRequestContext);

    // Build system prompt
    let systemPrompt = getLIASystemPrompt(fullContext);
    systemPrompt += buildPromptInjectionGuardrailPrompt(securityAssessment);

    // Append personalization settings
    if (sanitizedRequestContext?.userId) {
      systemPrompt = await appendPersonalizationPrompt(systemPrompt, sanitizedRequestContext.userId);
    }

    // Validate last message
    const lastMessage = sanitizedLastMessage;
    if (!lastMessage || lastMessage.role !== 'user') {
      return apiError(
        'USER_MESSAGE_REQUIRED',
        'Se requiere un mensaje del usuario',
        400,
      );
    }

    const latestAssistantContent = body.conversationId
      ? await getLatestAssistantMessageContent(body.conversationId)
      : null;
    const activeBugReportDraft = latestAssistantContent
      ? extractBugReportDraftToken(latestAssistantContent)
      : null;

    // Capacidades exclusivas del superadmin de plataforma dentro de /admin:
    // consulta global de usuarios y ejecución de acciones administrativas.
    // La autorización es fail-closed y vive en superadmin/authorization (rol de
    // sesión + panel + riesgo de inyección + rate limit + re-verificación en BD).
    // Para Business/BusinessUser el turno queda inerte: sin secciones de prompt
    // y sin capacidad de ejecutar nada.
    const currentPage =
      typeof sanitizedRequestContext?.currentPage === 'string'
        ? sanitizedRequestContext.currentPage
        : undefined;
    const superadminTurn = await resolveSuperadminTurn({
      sessionUser,
      currentPage,
      promptRiskAction: securityAssessment.action,
      request,
      latestAssistantContent,
      userMessage: lastMessage.content,
    });

    // El admin confirmó (o canceló) una acción propuesta: se resuelve sin pasar
    // por el modelo — una confirmación no necesita generación.
    if (superadminTurn.immediateResponse) {
      await persistConversationTurn({
        conversationId: body.conversationId,
        userId: sanitizedRequestContext?.userId,
        requestContext: sanitizedRequestContext,
        userMessage: lastMessage,
        assistantContent: superadminTurn.immediateResponse,
      });

      return buildAssistantResponse(
        superadminTurn.immediateResponse,
        shouldStream,
      );
    }

    systemPrompt += await buildSuperadminPromptSections({
      turn: superadminTurn,
      sessionUser,
      currentPage,
      promptRiskAction: securityAssessment.action,
      recentUserMessages: sanitizedMessages
        .filter((entry) => entry.role === 'user')
        .map((entry) => entry.content),
    });

    if (activeBugReportDraft) {
      const confirmationIntent = detectBugReportConfirmationIntent(
        lastMessage.content
      );

      if (confirmationIntent === 'confirm') {
        const { clientContent, assistantContentToPersist } =
          await submitConfirmedBugReport({
            draft: activeBugReportDraft,
            body,
            requestContext: sanitizedRequestContext,
            request,
          });

        await persistConversationTurn({
          conversationId: body.conversationId,
          userId: sanitizedRequestContext?.userId,
          requestContext: sanitizedRequestContext,
          userMessage: lastMessage,
          assistantContent: assistantContentToPersist,
        });

        return buildAssistantResponse(clientContent, shouldStream);
      }
    }

    const bugReportIntent = detectTechnicalBugReportIntent({
      message: lastMessage.content,
      isBugReportFlag: body.isBugReport || false,
      requestContext: sanitizedRequestContext,
      hasPendingDraft: Boolean(activeBugReportDraft),
    });

    // Optionally append bug-report context
    systemPrompt = await appendBugReportContext(
      systemPrompt,
      lastMessage.content,
      bugReportIntent.isBugReport,
      fullContext.currentPage,
      sanitizedRequestContext,
      Boolean(activeBugReportDraft)
    );

    if (activeBugReportDraft) {
      systemPrompt += buildPendingBugReportPromptSection(activeBugReportDraft);
    }

    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(googleApiKey);
    // Modelo general de SofLIA: configurado desde el panel de superadmin bajo el
    // propósito `lia_general` (independiente del modelo de las actividades de curso).
    const liaSettings = await getAiModelSettings('lia_general');
    const modelName = resolveGeminiModel(liaSettings.model);
    const liaGenerationConfig = buildManagedGenerationConfig(liaSettings);

    const model = genAI.getGenerativeModel({
      model: modelName,
      safetySettings: [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
      ],
      generationConfig: liaGenerationConfig,
    });

    const cleanHistory = buildCleanHistory(sanitizedMessages);
    const messageWithContext = buildCurrentTurnPrompt(systemPrompt, lastMessage.content);

    const chatSession = model.startChat({
      history: cleanHistory,
      generationConfig: liaGenerationConfig,
    });

    const messageParts = buildCurrentMessageParts(messageWithContext, lastMessage.attachments);

    // Streaming REAL: solo en el flujo común. Los turnos de reporte ya
    // identificados y los de superadmin con acciones habilitadas requieren
    // reescribir el contenido (token de confirmación) antes de enviarlo, por lo
    // que se mantienen en modo buffered. Cuando el reporte nace en un turno que
    // aquí parecía común, el streaming lo cubre: enmascara el bloque oculto y lo
    // conserva al persistir (ver `streamGeminiResponse`).
    const canStreamLive =
      shouldStream &&
      !bugReportIntent.isBugReport &&
      !activeBugReportDraft &&
      !superadminTurn.isEnabled;

    if (canStreamLive) {
      return await streamGeminiResponse({
        chatSession,
        parts: messageParts,
        body,
        requestContext: sanitizedRequestContext,
        securityAssessment,
      });
    }

    const result = await executeWithCircuitBreaker(
      'gemini-lia-chat',
      () => chatSession.sendMessage(messageParts),
      CIRCUIT_BREAKER_DEFAULTS.gemini,
    );
    const finalContent = result.response.text();

    // El modelo propuso una acción administrativa: se convierte en una solicitud
    // de confirmación firmada. El token viaja en el mensaje PERSISTIDO (el turno
    // siguiente lo verifica desde la BD) pero se retira del texto que ve el
    // admin. Solo se toma esta rama cuando hay acción, para no alterar el flujo
    // de reportes de bug de un superadmin.
    if (superadminTurn.isEnabled && hasActionBlock(finalContent)) {
      const contentWithAction = await finalizeSuperadminResponse({
        turn: superadminTurn,
        assistantContent: finalContent,
      });

      const persistedTurn = await persistConversationTurn({
        conversationId: body.conversationId,
        userId: sanitizedRequestContext?.userId,
        requestContext: sanitizedRequestContext,
        userMessage: lastMessage,
        assistantContent: contentWithAction,
      });

      return buildAssistantResponse(
        enforceSecurityResponsePolicy({
          content: stripActionTokens(contentWithAction),
          assessment: securityAssessment,
        }),
        shouldStream,
        persistedTurn
          ? {
              assistant_message_id: persistedTurn.assistantMessageId,
              conversation_id: persistedTurn.conversationId,
              user_message_id: persistedTurn.userMessageId,
            }
          : null,
      );
    }

    // Post-process: handle bug reports, save conversation history
    const { clientContent, chatProvenance } = await processAIResponse(
      finalContent,
      body,
      sanitizedRequestContext,
      request,
      activeBugReportDraft
    );
    const securedClientContent = enforceSecurityResponsePolicy({
      content: clientContent,
      assessment: securityAssessment,
    });

    if (securedClientContent !== clientContent) {
      recordSecurityEvent('security-response-rewritten', {
        pathname: request.nextUrl.pathname,
        method: request.method,
        userAgent: request.headers.get('user-agent') || undefined,
        ip:
          request.headers.get('cf-connecting-ip') ||
          request.headers.get('x-forwarded-for') ||
          undefined,
        reasons: securityAssessment.reasons,
        metadata: {
          score: securityAssessment.score,
          categories: securityAssessment.categories,
        },
      });
    }

    // Stream or JSON response
    return buildAssistantResponse(
      securedClientContent,
      shouldStream,
      chatProvenance,
    );

  } catch (error) {
    logger.error('LIA Chat API error', error);

    let errorMessage = 'Error interno del servidor';
    if (error instanceof Error) {
      errorMessage = error.message;
    }

    if (isGeminiAccessConfigurationError(errorMessage)) {
      const configurationMessage =
        'SofLIA no tiene acceso activo al servicio de Gemini. ' +
        'Revisa la API key, la facturacion y los permisos del proyecto de Google AI Studio.';

      return buildAssistantResponse(configurationMessage, shouldStream);
    }

    // Handle Rate Limit
    if (errorMessage.includes('429') || errorMessage.includes('quota') || errorMessage.includes('Too Many Requests')) {
      const politeMessage = "Lo siento, he alcanzado mi limite de capacidad. Por favor espera unos segundos.";

      return buildAssistantResponse(politeMessage, shouldStream);
    }

    // Degradacion elegante: ante CUALQUIER fallo del proveedor (billing/403,
    // modelo no disponible, red, etc.) respondemos un mensaje util en lugar de
    // un 500 que rompe la UI. El motivo preciso ya quedo en el log de arriba.
    const fallbackMessage =
      'En este momento no puedo responder por un problema temporal del servicio de IA. ' +
      'Por favor intenta de nuevo en unos minutos.';

    return buildAssistantResponse(fallbackMessage, shouldStream);
  }
}

export const POST = withZodBody(liaChatSchema, handlePost);

export async function GET() {
  return NextResponse.json({
    status: 'ready',
    message: 'LIA Chat API Ready with Platform Context'
  });
}
