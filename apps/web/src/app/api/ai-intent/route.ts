import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/utils/logger';
import { SessionService } from '../../../features/auth/services/session.service';
import { trackOpenAICall, calculateOpenAIMetadata } from '../../../lib/openai/usage-monitor';
import { fetchWithCircuitBreaker } from '@/lib/resilience/circuit-breaker';

/**
 * Endpoint para detección avanzada de intenciones con OpenAI
 * POST /api/ai-intent
 * 
 * Este endpoint es opcional y se usa cuando la detección local
 * no tiene suficiente confianza (< 0.7)
 */

export async function POST(request: NextRequest) {
  try {
    // 1. Verificar autenticación
    const user = await SessionService.getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // 2. Obtener mensaje del usuario
    const { message } = await request.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Mensaje inválido' },
        { status: 400 }
      );
    }

    // 3. Validar longitud del mensaje
    if (message.length > 500) {
      return NextResponse.json(
        { error: 'El mensaje es demasiado largo' },
        { status: 400 }
      );
    }

    // 4. Llamar a OpenAI para clasificar la intención
    const startTime = Date.now();
    const response = await fetchWithCircuitBreaker('openai-ai-intent', 'https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
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
    "targetPage": "página destino si aplica",
    "category": "categoría si aplica"
  }
}

Intenciones:
- create_prompt: Usuario quiere crear un prompt o plantilla de IA
- navigate: Usuario quiere ir a otra sección del sitio
- question: Usuario hace una pregunta
- feedback: Usuario da opinión o reporta problema
- general: Conversación general

NO incluyas ningún texto adicional, SOLO el JSON.`,
          },
          {
            role: 'user',
            content: message,
          },
        ],
        temperature: 0.3,
        max_tokens: 150,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      logger.error('Error en OpenAI API:', errorData);
      return NextResponse.json(
        { error: 'Error al procesar la intención' },
        { status: 500 }
      );
    }

    const data = await response.json();
    const responseTime = Date.now() - startTime;
    
    // ✅ Registrar uso de OpenAI
    if (data.usage) {
      await trackOpenAICall(calculateOpenAIMetadata(
        data.usage,
        'gpt-4o-mini',
        'ai-intent',
        user.id,
        responseTime
      ));
    }
    
    // 5. Parsear respuesta de OpenAI
    let intentResult;
    try {
      const content = data.choices[0].message.content;
      intentResult = JSON.parse(content);
    } catch (parseError) {
      logger.error('Error parseando respuesta de OpenAI:', parseError);
      return NextResponse.json(
        {
          error: 'Error al procesar la respuesta',
          fallback: {
            intent: 'general',
            confidence: 0.3,
          },
        },
        { status: 500 }
      );
    }

    // 6. Validar estructura de respuesta
    if (
      !intentResult.intent ||
      typeof intentResult.confidence !== 'number'
    ) {
      logger.warn('Respuesta de OpenAI con formato inválido:', intentResult);
      return NextResponse.json(
        {
          intent: 'general',
          confidence: 0.3,
        }
      );
    }

    // 7. Log de éxito
    logger.info('Intención detectada con IA:', {
      user_id: user.id,
      message_preview: message.substring(0, 50),
      intent: intentResult.intent,
      confidence: intentResult.confidence,
    });

    // 8. Retornar resultado
    return NextResponse.json(intentResult);
  } catch (error) {
    logger.error('Error en endpoint ai-intent:', error);
    return NextResponse.json(
      {
        error: 'Error interno del servidor',
        fallback: {
          intent: 'general',
          confidence: 0.3,
        },
      },
      { status: 500 }
    );
  }
}
