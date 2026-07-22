import { NextRequest, NextResponse } from 'next/server';

import { apiError } from '@/lib/api/errors';
import { withZodBody } from '@/lib/api/with-validation';
import { logger } from '@/lib/utils/logger';
import { SessionService } from '../../../features/auth/services/session.service';
import {
  calculateGeminiMetadata,
  trackAICall,
} from '../../../lib/ai/usage-monitor';
import { generateGeminiText } from '../../../lib/gemini/client';
import {
  aiIntentRequestSchema,
  aiIntentResultSchema,
  type AiIntentRequestBody,
} from './schema';

/**
 * Endpoint para deteccion avanzada de intenciones con Gemini.
 * POST /api/ai-intent
 */
async function handlePost(
  _request: NextRequest,
  body: AiIntentRequestBody,
) {
  try {
    const user = await SessionService.getCurrentUser();
    if (!user) {
      return apiError('UNAUTHORIZED', 'No autorizado', 401);
    }

    const { message } = body;
    const startTime = Date.now();
    const result = await generateGeminiText({
      circuitBreakerName: 'gemini-ai-intent',
      purpose: 'lia_intent',
      prompt: `Mensaje del usuario:
${message}

Devuelve SOLO el JSON solicitado.`,
      systemInstruction: `Eres un clasificador de intenciones para una plataforma educativa.
Analiza el mensaje del usuario y devuelve SOLO un JSON con este formato:
{
  "intent": "create_prompt" | "navigate" | "question" | "feedback" | "general",
  "confidence": 0.0 a 1.0,
  "entities": {
    "promptTopic": "tema del prompt si aplica",
    "targetPage": "pagina destino si aplica",
    "category": "categoria si aplica"
  }
}

Intenciones:
- create_prompt: Usuario quiere crear un prompt o plantilla de IA
- navigate: Usuario quiere ir a otra seccion del sitio
- question: Usuario hace una pregunta
- feedback: Usuario da opinion o reporta problema
- general: Conversacion general

NO incluyas ningun texto adicional, SOLO el JSON.`,
    });
    const responseTime = Date.now() - startTime;

    if (result.usage) {
      await trackAICall(
        calculateGeminiMetadata(
          result.usage,
          result.model,
          'ai-intent',
          user.id,
          responseTime,
        ),
      );
    }

    let intentResult: unknown;
    try {
      const content = result.text;
      if (typeof content !== 'string') {
        throw new Error('Gemini response content is missing');
      }
      intentResult = JSON.parse(content.trim().replace(/^```json\s*|\s*```$/g, ''));
    } catch (parseError) {
      logger.error('Error parseando respuesta de Gemini:', parseError);
      return apiError(
        'AI_INTENT_RESPONSE_PARSE_ERROR',
        'Error al procesar la respuesta',
        500,
      );
    }

    const parsedIntent = aiIntentResultSchema.safeParse(intentResult);
    if (!parsedIntent.success) {
      logger.warn('Respuesta de Gemini con formato invalido:', intentResult);
      return NextResponse.json({
        intent: 'general',
        confidence: 0.3,
      });
    }

    logger.info('Intencion detectada con IA:', {
      user_id: user.id,
      message_preview: message.substring(0, 50),
      intent: parsedIntent.data.intent,
      confidence: parsedIntent.data.confidence,
    });

    return NextResponse.json(parsedIntent.data);
  } catch (error) {
    logger.error('Error en endpoint ai-intent:', error);
    return apiError('AI_INTENT_INTERNAL_ERROR', 'Error interno del servidor', 500);
  }
}

export const POST = withZodBody(aiIntentRequestSchema, handlePost);
