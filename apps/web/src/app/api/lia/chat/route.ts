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
import { fetchPlatformContext, PlatformContext, ChatRequest } from './platform-context.service';
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
import { logger } from '@/lib/logger';
import {
  buildPendingBugReportPromptSection,
  detectBugReportConfirmationIntent,
  extractBugReportDraftToken,
  stripBugReportTokens,
  submitConfirmedBugReport,
} from './lia-report-workflow.service';
import type { ChatSession } from '@google/generative-ai';
import {
  getLatestAssistantMessageContent,
  persistConversationTurn,
} from './lia-chat-history.service';
import { detectTechnicalBugReportIntent } from './bug-report-intent.service';
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
 * (bloqueo pre-generación); aquí solo se limpian tokens internos y se aplica la
 * política de seguridad sobre el contenido que se guarda. Best-effort: un fallo
 * de persistencia no debe afectar la respuesta ya entregada al usuario.
 */
async function finalizeStreamedAssistantResponse(params: {
  fullText: string;
  body: LiaChatBody;
  requestContext: ChatRequest['context'];
  securityAssessment: SecurityAssessment;
}): Promise<void> {
  const { fullText, body, requestContext, securityAssessment } = params;
  try {
    const cleaned = stripBugReportTokens(fullText);
    const secured = enforceSecurityResponsePolicy({
      content: cleaned,
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
 * modelo lo genera (TTFT de ~1-2 s en lugar de esperar toda la respuesta). Solo
 * se usa en el flujo común (sin reporte de bug), donde el contenido no requiere
 * reescritura previa al envío. La persistencia/seguridad se aplican al cerrar.
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
  let fullText = '';

  const readable = new ReadableStream({
    async start(controller) {
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
          controller.enqueue(
            encoder.encode('data: ' + JSON.stringify({ content: piece, done: false }) + '\n\n'),
          );
        }
      } catch (streamError) {
        logger.error('LIA chat: error durante el streaming de Gemini', streamError);
        if (!fullText) {
          const fallback =
            'En este momento no puedo responder por un problema temporal del servicio de IA. ' +
            'Por favor intenta de nuevo en unos minutos.';
          fullText = fallback;
          controller.enqueue(
            encoder.encode('data: ' + JSON.stringify({ content: fallback, done: false }) + '\n\n'),
          );
        }
      } finally {
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

    let activeBugReportDraft = null;
    if (body.conversationId) {
      const latestAssistantContent = await getLatestAssistantMessageContent(
        body.conversationId
      );
      activeBugReportDraft = latestAssistantContent
        ? extractBugReportDraftToken(latestAssistantContent)
        : null;
    }

    if (activeBugReportDraft) {
      const confirmationIntent = detectBugReportConfirmationIntent(
        lastMessage.content
      );

      if (confirmationIntent === 'confirm') {
        const { clientContent } = await submitConfirmedBugReport({
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
          assistantContent: clientContent,
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
    // Modelo general de SofLIA: usa override dedicado y normaliza aliases viejos.
    // Si no hay configuracion, usa Gemini 3.5 Flash como fallback estable.
    const modelName = resolveGeminiModel(
      process.env.LIA_CHAT_GEMINI_MODEL || 'gemini-3.5-flash',
      'gemini-3.5-flash',
    );

    const model = genAI.getGenerativeModel({
      model: modelName,
      safetySettings: [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
      ],
      generationConfig: { maxOutputTokens: 8192, temperature: 0.7 },
    });

    const cleanHistory = buildCleanHistory(sanitizedMessages);
    const messageWithContext = buildCurrentTurnPrompt(systemPrompt, lastMessage.content);

    const chatSession = model.startChat({
      history: cleanHistory,
      generationConfig: { maxOutputTokens: 8192, temperature: 0.7 },
    });

    const messageParts = buildCurrentMessageParts(messageWithContext, lastMessage.attachments);

    // Streaming REAL: solo en el flujo común. Los flujos de reporte de bug
    // requieren reescribir el contenido (token de confirmación) antes de
    // enviarlo, por lo que se mantienen en modo buffered.
    const canStreamLive =
      shouldStream && !bugReportIntent.isBugReport && !activeBugReportDraft;

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

    // Post-process: handle bug reports, save conversation history
    const { clientContent, chatProvenance } = await processAIResponse(
      finalContent,
      body,
      sanitizedRequestContext,
      request,
      activeBugReportDraft,
      { allowBugReportDraft: bugReportIntent.isBugReport }
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
