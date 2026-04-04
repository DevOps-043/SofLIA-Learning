/**
 * API Route: LIA Context Help
 * Endpoint para que LIA reciba y analice contexto de sesión rrweb
 */

import { NextRequest, NextResponse } from 'next/server';
import { sessionAnalyzer } from '../../../../lib/rrweb/session-analyzer';
import { trackOpenAICall, calculateOpenAIMetadata } from '../../../../lib/openai/usage-monitor';
import type { eventWithTime } from '@rrweb/types';

interface ContextHelpRequest {
  question: string;
  sessionEvents: eventWithTime[];
  workshopId?: string;
  activityId?: string;
  analysisWindow?: number; // milisegundos, default 120000 (2 min)
}

export async function POST(request: NextRequest) {
  try {
    const body: ContextHelpRequest = await request.json();
    
    const { 
      question, 
      sessionEvents, 
      workshopId, 
      activityId,
      analysisWindow = 120000 
    } = body;

    // Validaciones
    if (!question || !question.trim()) {
      return NextResponse.json(
        { error: 'La pregunta es requerida' },
        { status: 400 }
      );
    }

    if (!sessionEvents || !Array.isArray(sessionEvents) || sessionEvents.length === 0) {
      return NextResponse.json(
        { error: 'No se proporcionaron eventos de sesión' },
        { status: 400 }
      );
    }

    // 1. Analizar la sesión

    const context = sessionAnalyzer.analyzeSession(sessionEvents, analysisWindow);
    const contextSummary = sessionAnalyzer.generateContextSummary(context);

    // 2. Construir prompt contextual para LIA
    const contextualPrompt = buildContextualPrompt(
      question,
      contextSummary,
      context,
      { workshopId, activityId }
    );

    // 3. Llamar a LIA (OpenAI)
    const liaResponse = await callLIA(contextualPrompt);

    // 4. Guardar la intervención (opcional, para analytics)
    // await saveIntervention({ question, context, response: liaResponse });

    return NextResponse.json({
      success: true,
      response: liaResponse,
      context: {
        summary: contextSummary,
        difficultyScore: context.difficultyScore,
        strugglingIndicators: context.strugglingIndicators,
        timeOnPage: context.timeOnPage,
      },
    });

  } catch (error) {
    console.error('❌ Error en context-help:', error);
    return NextResponse.json(
      { 
        error: 'Error procesando la solicitud',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Construye un prompt enriquecido con contexto para LIA
 */
interface ContextualHelpContext {
  difficultyScore: number
  timeOnPage: number
  resourcesViewed: unknown[]
  attemptsMade: number
  lastInputValues: Record<string, string>
}

function buildContextualPrompt(
  userQuestion: string,
  contextSummary: string,
  context: ContextualHelpContext,
  metadata: { workshopId?: string; activityId?: string }
): string {
  let prompt = `Eres SofLIA, la asistente virtual de SofLIA. Un usuario está trabajando en un taller y necesita tu ayuda.

## PREGUNTA DEL USUARIO:
"${userQuestion}"

## CONTEXTO DE SU SESIÓN:
${contextSummary}

## ANÁLISIS ADICIONAL:
`;

  // Agregar análisis específico según dificultad
  if (context.difficultyScore > 0.7) {
    prompt += `\n⚠️ El usuario parece estar teniendo dificultades significativas. Sé especialmente empático y claro en tu respuesta.`;
  }

  if (context.timeOnPage > 180000) {
    prompt += `\n⏱️ El usuario lleva bastante tiempo en esta página (${Math.round(context.timeOnPage / 60000)} minutos). Puede estar frustrado.`;
  }

  if (context.resourcesViewed.length === 0 && context.timeOnPage > 60000) {
    prompt += `\n📚 El usuario NO ha consultado recursos adicionales. Sugiérele revisar ejemplos o material de apoyo específico.`;
  }

  if (context.attemptsMade > 3) {
    prompt += `\n🔄 Ha hecho ${context.attemptsMade} intentos. Probablemente necesita un enfoque diferente o más guía paso a paso.`;
  }

  if (Object.keys(context.lastInputValues).length > 0) {
    prompt += `\n\n📝 IMPORTANTE: El usuario ha ingresado el siguiente contenido:\n`;
    Object.entries(context.lastInputValues).forEach(([field, value]) => {
      const truncated = value.length > 100 ? value.substring(0, 100) + '...' : value;
      prompt += `   • ${field}: "${truncated}"\n`;
    });
    prompt += `\nAnaliza estos inputs y proporciona feedback específico basado en lo que escribió.`;
  }

  prompt += `

## INSTRUCCIONES PARA TU RESPUESTA:
1. Sé específico y referencia lo que observaste en su sesión
2. Si detectaste inputs del usuario, analízalos y da feedback concreto
3. Proporciona pasos claros y accionables
4. Si es apropiado, sugiere recursos específicos que debería consultar
5. Sé empático si detectas frustración
6. Usa emojis para hacer la respuesta más amigable
7. Mantén un tono alentador y positivo

Responde de forma conversacional y útil:`;

  return prompt;
}

/**
 * Llama a la API de LIA (OpenAI) con el prompt contextual
 */
async function callLIA(prompt: string): Promise<string> {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      console.warn('⚠️ OPENAI_API_KEY no configurada, usando respuesta simulada');
      return generateMockResponse(prompt);
    }

    const startTime = Date.now();
    const model = 'gpt-4-turbo-preview';
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'system',
            content: 'Eres SofLIA, la asistente virtual experta en IA de la plataforma SofLIA. Eres empática, clara y siempre proporcionas ayuda práctica basada en el contexto específico del usuario.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 800,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const responseTime = Date.now() - startTime;
    
    // ✅ Registrar uso de OpenAI
    if (data.usage) {
      await trackOpenAICall(calculateOpenAIMetadata(
        data.usage,
        model,
        'lia-context-help',
        undefined, // No tenemos userId en este contexto
        responseTime
      ));
    }
    
    return data.choices[0]?.message?.content || 'Lo siento, no pude generar una respuesta.';

  } catch (error) {
    console.error('❌ Error llamando a OpenAI:', error);
    
    // Fallback a respuesta simulada
    return generateMockResponse(prompt);
  }
}

/**
 * Genera una respuesta simulada cuando no está disponible OpenAI
 * (útil para desarrollo y testing)
 */
function generateMockResponse(prompt: string): string {
  return `¡Hola! 👋

He analizado tu sesión y veo que estás trabajando en esta actividad. Basándome en lo que observé:

🔍 **Lo que noté:**
- Llevas un tiempo considerable en esta sección
- Has hecho varios intentos

💡 **Mi recomendación:**

1. **Revisa los ejemplos**: Antes de continuar, te sugiero revisar los ejemplos de referencia que están disponibles en la sección de recursos.

2. **Pasos claros**: Intenta seguir esta estructura paso a paso:
   - Primero, define el contexto
   - Luego, especifica el rol
   - Finalmente, indica el objetivo

3. **No te rindas**: ¡Vas por buen camino! A veces solo necesitamos un pequeño ajuste en el enfoque.

¿Te gustaría que te explique algún concepto específico con más detalle? 🤓

---
_Nota: Esta es una respuesta simulada para desarrollo. En producción, LIA usará IA real para respuestas más personalizadas._`;
}
