import { NextRequest, NextResponse } from 'next/server';

import { apiError } from '@/lib/api/errors';
import { withZodBody } from '@/lib/api/with-validation';
import { logger } from '@/lib/utils/logger';
import { fetchWithCircuitBreaker } from '@/lib/resilience/circuit-breaker';
import { SessionService } from '../../../features/auth/services/session.service';
import {
  calculateOpenAIMetadata,
  trackOpenAICall,
} from '../../../lib/openai/usage-monitor';
import {
  aiIntentRequestSchema,
  aiIntentResultSchema,
  type AiIntentRequestBody,
} from './schema';

/**
 * Endpoint para deteccion avanzada de intenciones con OpenAI.
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
    const response = await fetchWithCircuitBreaker(
      'openai-ai-intent',
      'https://api.openai.com/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: `Eres un clasificador de intenciones para una plataforma educativa.
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
            },
            {
              role: 'user',
              content: message,
            },
          ],
          temperature: 0.3,
          max_tokens: 150,
        }),
      },
    );

    if (!response.ok) {
      const errorData = await response.text();
      logger.error('Error en OpenAI API:', errorData);
      return apiError(
        'AI_INTENT_PROCESSING_ERROR',
        'Error al procesar la intencion',
        500,
      );
    }

    const data = await response.json();
    const responseTime = Date.now() - startTime;

    if (data.usage) {
      await trackOpenAICall(
        calculateOpenAIMetadata(
          data.usage,
          'gpt-4o-mini',
          'ai-intent',
          user.id,
          responseTime,
        ),
      );
    }

    let intentResult: unknown;
    try {
      const content = data?.choices?.[0]?.message?.content;
      if (typeof content !== 'string') {
        throw new Error('OpenAI response content is missing');
      }
      intentResult = JSON.parse(content);
    } catch (parseError) {
      logger.error('Error parseando respuesta de OpenAI:', parseError);
      return apiError(
        'AI_INTENT_RESPONSE_PARSE_ERROR',
        'Error al procesar la respuesta',
        500,
      );
    }

    const parsedIntent = aiIntentResultSchema.safeParse(intentResult);
    if (!parsedIntent.success) {
      logger.warn('Respuesta de OpenAI con formato invalido:', intentResult);
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
