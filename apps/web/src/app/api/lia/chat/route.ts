import { NextRequest, NextResponse } from 'next/server';
import type { AiContentPart } from '@/lib/ai/providers';
import type { PromptModelProfile } from '@/lib/ai/prompts';
import {
  generateAiText,
  isAiPurposeAvailable,
  streamAiText,
  type GenerateAiTextParams,
} from '@/lib/ai/providers/ai-text-gateway.server';
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
import { resolveChatOrganizationContext } from './organization-context.service';
import { getLIASystemPrompt } from './system-prompt.service';
import {
  buildFullContext,
  buildPersonalizationSection,
  buildBugReportContextSection,
  buildCleanHistory,
} from './chat-context.builder';
import { buildCurrentTurnPrompt } from './prompt-current-turn.service';
import { processAIResponse } from './chat-response.formatter';
import { toInlineImagePart } from '@/core/reporting/report-problem.server';

import { logger } from '@/lib/logger';
import {
  BUG_REPORT_CONFIRMATION_REMINDER,
  BUG_REPORT_MISSING_DRAFT_REPLY,
  awaitsBugReportDetails,
  buildPendingBugReportPromptSection,
  containsBugReportToken,
  createBugReportTokenStreamMask,
  detectBugReportConfirmationIntent,
  extractBugReportDraftToken,
  markPendingBugReportDetails,
  prepareDraftResponseForPersistence,
  requestsBugReportConfirmation,
  stripBugReportTokens,
  submitConfirmedBugReport,
  type LiaChatProcessingBody,
} from './lia-report-workflow.service';
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
import {
  createActionBlockStreamMask,
  hasActionBlock,
  stripActionInternalContent,
  stripActionBlock,
  stripActionTokens,
} from './superadmin/actions';
import { liaChatSchema, type LiaChatBody } from '../_schemas';
import { SessionService } from '@/features/auth/services/session.service';

type SecurityAssessment = ReturnType<typeof evaluatePromptInjectionRisk>;

function buildCurrentMessageParts(
  promptWithContext: string,
  attachments: ChatRequest['messages'][number]['attachments']
): AiContentPart[] {
  const parts: AiContentPart[] = [{ text: promptWithContext, type: 'text' }];

  if (!attachments?.length) {
    return parts;
  }

  parts.push({
    text:
      'El usuario adjunto evidencia visual. Usa las imagenes como contexto para entender mejor el problema o la pregunta.',
    type: 'text',
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

function buildAssistantStreamResponse(
  content: string,
  navigateTo?: string | null,
  downloads: Array<{
    url: string
    method: 'POST'
    body: Record<string, string | number | boolean>
  }> = [],
): Response {
  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    start(controller) {
      const chunkSize = 50;
      let index = 0;

      function push() {
        if (index >= content.length) {
          controller.enqueue(
            encoder.encode(
              'data: ' +
                JSON.stringify({
                  done: true,
                  navigateTo: navigateTo || undefined,
                  downloads: downloads.length ? downloads : undefined,
                }) +
                '\n\n'
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
  navigateTo?: string | null,
  downloads: Array<{
    url: string
    method: 'POST'
    body: Record<string, string | number | boolean>
  }> = [],
) {
  // Último candado de salida: ningún marcador interno puede llegar a pantalla,
  // transcripción o TTS aunque una rama futura olvide retirarlo.
  const visibleContent = stripActionInternalContent(content);

  if (shouldStream) {
    return buildAssistantStreamResponse(visibleContent, navigateTo, downloads);
  }

  return NextResponse.json({
    chat_provenance: chatProvenance || undefined,
    navigate_to: navigateTo || undefined,
    downloads: downloads.length ? downloads : undefined,
    message: { role: 'assistant', content: visibleContent },
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
async function streamAiResponse(params: {
  aiRequest: GenerateAiTextParams;
  body: LiaChatBody;
  requestContext: ChatRequest['context'];
  securityAssessment: SecurityAssessment;
}): Promise<Response> {
  const { aiRequest, body, requestContext, securityAssessment } = params;

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
        // El gateway aplica el circuit breaker al abrir el stream y emite solo
        // texto visible (descarta las partes de razonamiento interno).
        const aiStream = await streamAiText(aiRequest);

        for await (const piece of aiStream.textChunks) {
          fullText += piece;
          emit(tokenMask.push(piece));
        }
      } catch (streamError) {
        logger.error('LIA chat: error durante el streaming del proveedor de IA', streamError);
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

/**
 * Emite el texto administrativo conforme lo genera el LLM y oculta el JSON de
 * la acción. Al cerrar el stream valida la propuesta contra BD y agrega la
 * confirmación firmada. El audio puede sintetizar los primeros lotes mientras
 * el modelo y la vista previa terminan los siguientes.
 */
async function streamAdminActionResponse(params: {
  aiRequest: GenerateAiTextParams;
  body: LiaChatBody;
  requestContext: ChatRequest['context'];
  securityAssessment: SecurityAssessment;
  turn: Awaited<ReturnType<typeof resolveSuperadminTurn>>;
}): Promise<Response> {
  const { aiRequest, body, requestContext, securityAssessment, turn } = params;
  const encoder = new TextEncoder();

  const readable = new ReadableStream({
    async start(controller) {
      let fullText = '';
      let emittedVisible = '';
      const actionMask = createActionBlockStreamMask();

      const emit = (text: string) => {
        if (!text) return;
        emittedVisible += text;
        controller.enqueue(
          encoder.encode(
            'data: ' + JSON.stringify({ content: text, done: false }) + '\n\n',
          ),
        );
      };

      try {
        const aiStream = await streamAiText(aiRequest);
        for await (const piece of aiStream.textChunks) {
          fullText += piece;
          emit(actionMask.push(piece));
        }
        emit(actionMask.flush());

        const contentWithAction = await finalizeSuperadminResponse({
          turn,
          assistantContent: fullText,
        });
        const securedContent = enforceSecurityResponsePolicy({
          content: stripActionTokens(contentWithAction),
          assessment: securityAssessment,
        });

        // `processProposedAction` conserva el texto natural y agrega al final la
        // confirmación. Solo enviamos esa parte nueva para no repetir el audio.
        if (securedContent.startsWith(emittedVisible)) {
          emit(securedContent.slice(emittedVisible.length));
        } else {
          const modelVisible = stripActionBlock(fullText);
          if (securedContent.startsWith(modelVisible)) {
            emit(securedContent.slice(modelVisible.length));
          }
        }

        await persistConversationTurn({
          conversationId: body.conversationId,
          userId: requestContext?.userId,
          requestContext,
          userMessage: body.messages[body.messages.length - 1],
          assistantContent: contentWithAction,
        });
      } catch (streamError) {
        logger.error('LIA chat: error durante streaming administrativo', streamError);
        emit(
          `${emittedVisible ? '\n\n' : ''}⚠️ No pude dejar lista la confirmación. ` +
            'No se ejecutó ningún cambio; inténtalo nuevamente.',
        );
      } finally {
        controller.enqueue(
          encoder.encode('data: ' + JSON.stringify({ done: true }) + '\n\n'),
        );
        controller.close();
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

    // Se comprueba la credencial del proveedor CONFIGURADO para SofLIA, no la de
    // Gemini: si un superadministrador cambia `lia_general` a un modelo de
    // OpenAI, la clave que debe existir es la de OpenAI.
    if (!(await isAiPurposeAvailable('lia_general'))) {
      logger.error('El proveedor de IA configurado para SofLIA no tiene credenciales');
      return apiError(
        'AI_PROVIDER_KEY_MISSING',
        'El proveedor de IA configurado no tiene credenciales',
        503,
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
    // No se confía en `context.userId` del cliente: un actor sin sesión podría
    // falsificarlo para leer o anexar mensajes a una conversación ajena. Solo
    // la identidad autenticada del servidor puede persistir historial u obtener
    // capacidades administrativas; el chat puede degradar sin persistencia.
    const sessionUser = await SessionService.getCurrentUser().catch(() => null);
    const authoritativeUserId = sessionUser?.id;
    if (sanitizedRequestContext) {
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
    const activeOrganizationContext = await resolveChatOrganizationContext({
      userId: sanitizedRequestContext?.userId,
      requestedOrganizationId:
        typeof sanitizedRequestContext?.organizationId === 'string'
          ? sanitizedRequestContext.organizationId
          : undefined,
      currentPage: sanitizedRequestContext?.currentPage,
      platformRole: sessionUser?.platform_role,
    });
    if (sanitizedRequestContext && activeOrganizationContext) {
      // El tenant resuelto por el servidor prevalece sobre organizationId/slug
      // enviados por el cliente. Todo el turno (prompt, historial y acciones)
      // queda así referido a la misma organización autorizada.
      sanitizedRequestContext.organizationId = activeOrganizationContext.organizationId;
      sanitizedRequestContext.organizationSlug = activeOrganizationContext.organizationSlug;
      sanitizedRequestContext.organizationName = activeOrganizationContext.organizationName;
    }
    const platformContext = await fetchPlatformContext({
      userId: sanitizedRequestContext?.userId,
      organizationContext: activeOrganizationContext,
    });
    const fullContext: PlatformContext = await buildFullContext(platformContext, sanitizedRequestContext);

    // Las piezas dinámicas del prompt se resuelven ANTES (son asíncronas: leen
    // base de datos). La composición final se difiere a una función del dialecto
    // porque el proveedor —y con él la forma de redactar— no se conoce hasta que
    // el gateway resuelve la configuración del propósito.
    const personalizationSection = sanitizedRequestContext?.userId
      ? await buildPersonalizationSection(sanitizedRequestContext.userId)
      : '';

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
      ? await getLatestAssistantMessageContent(
          body.conversationId,
          authoritativeUserId,
        )
      : null;
    const activeBugReportDraft = latestAssistantContent
      ? extractBugReportDraftToken(latestAssistantContent)
      : null;
    // SofLIA ya abrio el flujo y pidio el detalle del problema. Este turno es la
    // respuesta a esa peticion, aunque el texto del usuario no vuelva a nombrar
    // ningun sintoma reconocible por la heuristica de intencion.
    const awaitingBugReportDetails = Boolean(
      latestAssistantContent &&
        !activeBugReportDraft &&
        awaitsBugReportDetails(latestAssistantContent),
    );

    // Capacidades exclusivas del superadmin de plataforma dentro de /admin:
    // consulta global de usuarios y ejecución de acciones administrativas.
    // La autorización es fail-closed y vive en superadmin/authorization (rol de
    // sesión + panel + riesgo de inyección + rate limit + re-verificación en BD).
    // Los owners/admins del business-panel reciben solo el catálogo ligado a su
    // tenant. Business-user y cualquier otra superficie quedan inertes.
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
      activeOrganizationContext,
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
        null,
        superadminTurn.navigationPath,
        superadminTurn.downloads,
      );
    }

    const superadminSection = await buildSuperadminPromptSections({
      turn: superadminTurn,
      sessionUser,
      currentPage,
      promptRiskAction: securityAssessment.action,
      recentUserMessages: sanitizedMessages
        .filter((entry) => entry.role === 'user')
        .map((entry) => entry.content),
      isVoiceInteraction:
        sanitizedRequestContext?.interactionMode === 'voice-conversation',
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

    // Confirmacion dentro del flujo de reporte pero SIN borrador que confirmar.
    // Se resuelve sin pasar por el modelo: dejado a su criterio, responde que el
    // reporte "quedo confirmado y el sistema continuara con el envio" y el
    // usuario se va convencido de haber reportado algo que no existe. El guardia
    // exige la marca de flujo abierto, de modo que un "confirmo" cualquiera de la
    // conversacion normal sigue su curso.
    if (!activeBugReportDraft && awaitingBugReportDetails) {
      const confirmationIntent = detectBugReportConfirmationIntent(
        lastMessage.content,
      );

      if (confirmationIntent === 'confirm') {
        await persistConversationTurn({
          conversationId: body.conversationId,
          userId: sanitizedRequestContext?.userId,
          requestContext: sanitizedRequestContext,
          userMessage: lastMessage,
          // La marca viaja de vuelta al historial: el flujo sigue abierto y la
          // descripcion que el usuario escriba a continuacion debe seguir
          // tratandose como reporte.
          assistantContent: markPendingBugReportDetails(
            BUG_REPORT_MISSING_DRAFT_REPLY,
          ),
        });

        return buildAssistantResponse(
          BUG_REPORT_MISSING_DRAFT_REPLY,
          shouldStream,
        );
      }
    }

    const bugReportIntent = detectTechnicalBugReportIntent({
      message: lastMessage.content,
      isBugReportFlag: body.isBugReport || false,
      requestContext: sanitizedRequestContext,
      hasPendingDraft: Boolean(activeBugReportDraft) || awaitingBugReportDetails,
    });

    const bugReportContextSection = await buildBugReportContextSection(
      lastMessage.content,
      bugReportIntent.isBugReport,
      fullContext.currentPage,
      sanitizedRequestContext,
      Boolean(activeBugReportDraft)
    );

    const pendingDraftSection = activeBugReportDraft
      ? buildPendingBugReportPromptSection(activeBugReportDraft)
      : '';

    // Modelo, proveedor y DIALECTO de SofLIA: configurados desde el panel de
    // superadmin bajo el propósito `lia_general`. El gateway resuelve los tres y
    // entrega el dialecto a esta función, de modo que el mismo prompt se redacta
    // en el idioma de Gemini o en el de OpenAI sin duplicar contenido.
    const cleanHistory = buildCleanHistory(sanitizedMessages);

    const buildPromptParts = (profile: PromptModelProfile) => {
      const systemPrompt = [
        getLIASystemPrompt(profile, fullContext),
        buildPromptInjectionGuardrailPrompt(securityAssessment),
        personalizationSection,
        superadminSection,
        bugReportContextSection,
        pendingDraftSection,
      ]
        .filter(Boolean)
        .join('');

      return buildCurrentMessageParts(
        buildCurrentTurnPrompt(profile, systemPrompt, lastMessage.content),
        lastMessage.attachments,
      );
    };

    const aiRequest = {
      circuitBreakerName: 'gemini-lia-chat',
      history: cleanHistory,
      prompt: buildPromptParts,
      purpose: 'lia_general' as const,
    };

    // Streaming REAL: solo en el flujo común. Los turnos de reporte ya
    // identificados y los de superadmin con acciones habilitadas requieren
    // reescribir el contenido (token de confirmación) antes de enviarlo, por lo
    // que se mantienen en modo buffered. Cuando el reporte nace en un turno que
    // aquí parecía común, el streaming lo cubre: enmascara el bloque oculto y lo
    // conserva al persistir (ver `streamAiResponse`).
    const canStreamAdminAction =
      shouldStream &&
      superadminTurn.isEnabled &&
      !bugReportIntent.isBugReport &&
      !activeBugReportDraft;

    if (canStreamAdminAction) {
      return await streamAdminActionResponse({
        aiRequest,
        body,
        requestContext: sanitizedRequestContext,
        securityAssessment,
        turn: superadminTurn,
      });
    }

    const canStreamLive =
      shouldStream &&
      !bugReportIntent.isBugReport &&
      !activeBugReportDraft &&
      !superadminTurn.isEnabled;

    if (canStreamLive) {
      return await streamAiResponse({
        aiRequest,
        body,
        requestContext: sanitizedRequestContext,
        securityAssessment,
      });
    }

    const result = await generateAiText(aiRequest);
    const finalContent = result.text;

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
      activeBugReportDraft,
      bugReportIntent.isBugReport
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
