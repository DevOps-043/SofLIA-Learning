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
import { logger } from '@/lib/logger';
import {
  buildPendingBugReportPromptSection,
  detectBugReportConfirmationIntent,
  extractBugReportDraftToken,
  submitConfirmedBugReport,
} from './lia-report-workflow.service';
import {
  getLatestAssistantMessageContent,
  persistConversationTurn,
} from './lia-chat-history.service';
import { detectTechnicalBugReportIntent } from './bug-report-intent.service';
import { liaChatSchema, type LiaChatBody } from '../_schemas';

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
      'El usuario adjuntó evidencia visual. Usa las imágenes como contexto para entender mejor el problema o la pregunta.',
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
    headers: { 'Content-Type': 'text/event-stream' },
  });
}

function buildAssistantResponse(content: string, shouldStream: boolean) {
  if (shouldStream) {
    return buildAssistantStreamResponse(content);
  }

  return NextResponse.json({
    message: { role: 'assistant', content },
  });
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
    const googleApiKey = process.env.GOOGLE_API_KEY;
    if (!googleApiKey) {
      logger.error('GOOGLE_API_KEY no esta configurada');
      return apiError(
        'GOOGLE_API_KEY_MISSING',
        'GOOGLE_API_KEY no está configurada',
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
    const modelName = process.env.GEMINI_MODEL || 'gemini-2.0-flash-exp';

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

    const result = await executeWithCircuitBreaker(
      'gemini-lia-chat',
      () => chatSession.sendMessage(
        buildCurrentMessageParts(messageWithContext, lastMessage.attachments)
      ),
      CIRCUIT_BREAKER_DEFAULTS.gemini,
    );
    const finalContent = result.response.text();

    // Post-process: handle bug reports, save conversation history
    const { clientContent } = await processAIResponse(
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
    return buildAssistantResponse(securedClientContent, shouldStream);

  } catch (error) {
    logger.error('LIA Chat API error', error);

    let errorMessage = 'Error interno del servidor';
    if (error instanceof Error) {
      errorMessage = error.message;
    }

    // Handle Rate Limit
    if (errorMessage.includes('429') || errorMessage.includes('quota') || errorMessage.includes('Too Many Requests')) {
      const politeMessage = "⏳ Lo siento, he alcanzado mi límite de capacidad. Por favor espera unos segundos.";

      return buildAssistantResponse(politeMessage, shouldStream);
    }

    return apiError('LIA_CHAT_ERROR', errorMessage, 500);
  }
}

export const POST = withZodBody(liaChatSchema, handlePost);

export async function GET() {
  return NextResponse.json({
    status: 'ready',
    message: 'LIA Chat API Ready with Platform Context'
  });
}
