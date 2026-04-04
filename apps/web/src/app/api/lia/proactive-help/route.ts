/**
 * 🤖 API Endpoint: Proactive Help from LIA
 * 
 * Endpoint que recibe patrones de dificultad detectados y genera
 * sugerencias contextuales automáticas de LIA.
 * 
 * POST /api/lia/proactive-help
 * 
 * Body: {
 *   analysis: DifficultyAnalysis,
 *   sessionEvents: eventWithTime[],
 *   workshopId?: string,
 *   activityId?: string
 * }
 * 
 * Response: {
 *   success: boolean,
 *   response: string,
 *   suggestions: string[],
 *   resources?: Resource[]
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import type { DifficultyAnalysis } from '../../../../lib/rrweb/difficulty-pattern-detector';
import type { eventWithTime } from '@rrweb/types';
import { SessionAnalyzer, type SessionContext } from '../../../../lib/rrweb/session-analyzer';
import { trackOpenAICall, calculateOpenAIMetadata } from '../../../../lib/openai/usage-monitor';

type ProactiveResource = NonNullable<ProactiveHelpResponse['resources']>[number];

interface ProactiveHelpRequest {
  analysis: DifficultyAnalysis;
  sessionEvents: eventWithTime[];
  workshopId?: string;
  activityId?: string;
  userId?: string;
}

interface ProactiveHelpResponse {
  success: boolean;
  response: string;
  suggestions: string[];
  resources?: Array<{
    title: string;
    description: string;
    url?: string;
  }>;
  nextSteps?: string[];
}

export async function POST(request: NextRequest) {
  try {
    const body: ProactiveHelpRequest = await request.json();
    const { analysis, sessionEvents, workshopId, activityId } = body;

    // Validaciones
    if (!analysis) {
      return NextResponse.json(
        { error: 'Missing analysis data' },
        { status: 400 }
      );
    }

    // Analizar sesión para obtener contexto adicional
    const sessionAnalyzer = new SessionAnalyzer();
    const sessionContext = sessionEvents && sessionEvents.length > 0
      ? sessionAnalyzer.analyzeSession(sessionEvents, 180000) // 3 minutos
      : null;

    // Construir prompt contextual para LIA
    const prompt = buildProactivePrompt(analysis, sessionContext, workshopId, activityId);

    // Llamar a OpenAI (o servicio de LIA)
    let liaResponse: string;
    let suggestions: string[];
    let resources: ProactiveResource[] = [];
    let nextSteps: string[] = [];

    const openaiApiKey = process.env.OPENAI_API_KEY;

    if (openaiApiKey) {
      const startTime = Date.now();
      const model = 'gpt-4-turbo-preview';
      
      // Llamada real a OpenAI
      const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiApiKey}`
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: 'system',
              content: `Eres LIA, una tutora virtual especializada en inteligencia artificial y aprendizaje personalizado. 
              Tu tarea es ofrecer ayuda proactiva cuando detectas que un usuario tiene dificultades. 
              Sé empática, específica y constructiva. Ofrece pasos concretos y ejemplos prácticos.`
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 800
        })
      });

      if (!openaiResponse.ok) {
        console.error('Error llamando a OpenAI:', await openaiResponse.text());
        throw new Error('OpenAI API error');
      }

      const data = await openaiResponse.json();
      const responseTime = Date.now() - startTime;
      
      // ✅ Registrar uso de OpenAI
      if (data.usage) {
        await trackOpenAICall(calculateOpenAIMetadata(
          data.usage,
          model,
          'lia-proactive-help',
          body.userId,
          responseTime
        ));
      }
      
      liaResponse = data.choices[0]?.message?.content || 'Lo siento, no pude generar una respuesta.';
      
      // Extraer sugerencias del response (LIA puede formatear con bullets)
      suggestions = extractSuggestions(liaResponse);
      resources = generateResources(analysis.patterns);
      nextSteps = extractNextSteps(liaResponse);

    } else {
      // Fallback: respuestas simuladas para desarrollo

      const mockResponse = generateMockProactiveResponse(analysis, sessionContext);
      liaResponse = mockResponse.response;
      suggestions = mockResponse.suggestions;
      resources = mockResponse.resources || [];
      nextSteps = mockResponse.nextSteps || [];
    }

    // Log de respuesta generada

    return NextResponse.json<ProactiveHelpResponse>({
      success: true,
      response: liaResponse,
      suggestions,
      resources: resources.length > 0 ? resources : undefined,
      nextSteps: nextSteps.length > 0 ? nextSteps : undefined
    });

  } catch (error) {
    console.error('❌ Error en /api/lia/proactive-help:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Construye prompt contextual para LIA
 */
function buildProactivePrompt(
  analysis: DifficultyAnalysis,
  sessionContext: SessionContext | null,
  workshopId?: string,
  activityId?: string
): string {
  const patternDescriptions = analysis.patterns
    .map(p => `- ${p.description} (severidad: ${p.severity})`)
    .join('\n');

  return `
# Contexto de la situación

He detectado que el usuario está experimentando dificultades en el taller. Aquí están los detalles:

## Patrones de dificultad detectados:
${patternDescriptions}

## Score de dificultad: ${(analysis.overallScore * 100).toFixed(0)}%

${sessionContext ? `
## Análisis de sesión:
- Tiempo total: ${Math.round(sessionContext.sessionDuration / 1000)}s
- Clicks totales: ${sessionContext.clickCount}
- Scrolls: ${sessionContext.scrollEvents}
- Inputs escritos: ${sessionContext.inputEvents}
- Intentos detectados: ${sessionContext.attemptsMade}
- Nivel de dificultad: ${sessionContext.difficultyScore.toFixed(2)}
` : ''}

${workshopId ? `Workshop ID: ${workshopId}` : ''}
${activityId ? `Actividad ID: ${activityId}` : ''}

# Tu tarea

Como LIA, ofrece ayuda proactiva al usuario. Tu respuesta debe:

1. **Ser empática**: Reconoce que aprender puede ser desafiante
2. **Ser específica**: Referencia los patrones detectados de forma natural
3. **Ser accionable**: Ofrece pasos concretos que el usuario pueda seguir ahora mismo
4. **Ser motivadora**: Mantén un tono positivo y alentador

Estructura tu respuesta en:
- Un saludo breve y empático
- Observación de lo que has notado (sin ser muy técnico)
- 2-3 sugerencias concretas para ayudar
- Una pregunta abierta para continuar la conversación

Ejemplo de tono: "Hola! He notado que llevas un rato trabajando en esta actividad. A veces cuando [patrón detectado], puede ayudar [sugerencia]. ¿Te gustaría que revisemos juntos [tema específico]?"
`.trim();
}

/**
 * Extrae sugerencias de la respuesta de LIA
 */
function extractSuggestions(response: string): string[] {
  const suggestions: string[] = [];
  
  // Buscar bullets o listas numeradas
  const bulletPattern = /[•\-*]\s*(.+)/g;
  const numberedPattern = /\d+\.\s*(.+)/g;
  
  let match;
  while ((match = bulletPattern.exec(response)) !== null) {
    suggestions.push(match[1].trim());
  }
  
  while ((match = numberedPattern.exec(response)) !== null) {
    suggestions.push(match[1].trim());
  }
  
  return suggestions.slice(0, 5); // Máximo 5 sugerencias
}

/**
 * Extrae próximos pasos de la respuesta
 */
function extractNextSteps(response: string): string[] {
  // Similar a extractSuggestions pero busca secciones de "próximos pasos"
  const nextStepsSection = response.match(/pr[oó]ximos?\s+pasos?:(.+?)(?:\n\n|$)/is);
  if (!nextStepsSection) return [];
  
  const steps: string[] = [];
  const bulletPattern = /[•\-*]\s*(.+)/g;
  
  let match;
  while ((match = bulletPattern.exec(nextStepsSection[1])) !== null) {
    steps.push(match[1].trim());
  }
  
  return steps;
}

/**
 * Genera recursos relevantes según los patrones detectados
 */
function generateResources(patterns: DifficultyAnalysis['patterns']): ProactiveResource[] {
  const resources: ProactiveResource[] = [];
  
  patterns.forEach(pattern => {
    switch (pattern.type) {
      case 'failed_attempts':
        resources.push({
          title: 'Guía: Cómo estructurar un buen prompt',
          description: 'Aprende las mejores prácticas para crear prompts efectivos',
          url: '/recursos/guia-prompts'
        });
        break;
      case 'excessive_scroll':
        resources.push({
          title: 'Video: Resumen de conceptos clave',
          description: 'Repaso rápido de los conceptos principales de esta lección',
          url: '/recursos/video-resumen'
        });
        break;
      case 'inactivity':
        resources.push({
          title: 'Tip: Técnica Pomodoro para el aprendizaje',
          description: 'Cómo mantener el enfoque durante el estudio',
          url: '/recursos/pomodoro'
        });
        break;
    }
  });
  
  // Remover duplicados
  return Array.from(new Map(resources.map(r => [r.title, r])).values());
}

/**
 * Genera respuesta simulada para desarrollo (sin OpenAI API key)
 */
function generateMockProactiveResponse(
  analysis: DifficultyAnalysis,
  sessionContext: SessionContext | null
): ProactiveHelpResponse {
  const primaryPattern = analysis.patterns[0];
  
  const responses: Record<string, ProactiveHelpResponse> = {
    inactivity: {
      success: true,
      response: `¡Hola! He notado que llevas un rato sin actividad. A veces es útil tomar un pequeño descanso y volver con mente fresca. 

Mientras tanto, aquí hay algunas cosas que podrían ayudarte:

• Revisa el ejemplo que vimos al principio - a veces verlo de nuevo con perspectiva fresca ayuda mucho
• Si algo no está claro, no dudes en preguntarme específicamente sobre esa parte
• Intenta explicar el concepto en tus propias palabras - esto ayuda a identificar qué partes entiendes y cuáles no

¿Hay algo específico de esta actividad que te gustaría que revisemos juntos?`,
      suggestions: [
        'Toma un descanso de 5 minutos y vuelve con mente fresca',
        'Revisa el ejemplo inicial de la lección',
        'Intenta explicar el concepto en tus propias palabras'
      ],
      resources: [
        {
          title: 'Técnica Pomodoro para el aprendizaje',
          description: 'Cómo mantener el enfoque durante el estudio',
          url: '/recursos/pomodoro'
        }
      ],
      nextSteps: [
        'Revisa el material de la lección',
        'Intenta el ejercicio con un enfoque diferente',
        'Pregúntame sobre partes específicas'
      ]
    },
    failed_attempts: {
      success: true,
      response: `¡Hey! Veo que has intentado varias veces esta actividad. ¡Eso muestra perseverancia! 🎯

He notado los ${sessionContext?.attemptsMade || 3} intentos que has hecho. A menudo, cuando esto pasa, puede ayudar:

• Revisar la estructura del ejemplo dado - compara tu respuesta con el patrón mostrado
• Verificar que estás incluyendo todos los elementos clave (rol, contexto, objetivo)
• Leer la instrucción con más calma - a veces nos saltamos detalles importantes

Basándome en tus intentos, ¿te gustaría que revisemos juntos qué elementos podrían estar faltando?`,
      suggestions: [
        'Compara tu respuesta con el ejemplo dado',
        'Verifica que incluyes: rol, contexto y objetivo',
        'Relee la instrucción paso a paso'
      ],
      resources: [
        {
          title: 'Guía: Cómo estructurar un buen prompt',
          description: 'Aprende las mejores prácticas para crear prompts efectivos'
        }
      ]
    },
    excessive_scroll: {
      success: true,
      response: `Noto que estás buscando información en el material. ¡Esa es una buena estrategia! 📚

Para ayudarte a encontrar lo que necesitas más rápido:

• Usa Ctrl+F (o Cmd+F en Mac) para buscar palabras clave
• Los conceptos más importantes suelen estar en los primeros párrafos de cada sección
• Si buscas un ejemplo específico, fíjate en las secciones marcadas con "Ejemplo:"

¿Hay algo específico que estás buscando? Puedo dirigirte directamente a la sección relevante.`,
      suggestions: [
        'Usa Ctrl+F para buscar palabras clave',
        'Revisa los resúmenes al final de cada sección',
        'Pregúntame directamente sobre el concepto que buscas'
      ],
      resources: [
        {
          title: 'Video: Resumen de conceptos clave',
          description: 'Repaso rápido de los conceptos principales'
        }
      ]
    },
    frequent_deletion: {
      success: true,
      response: `Veo que estás refinando tu respuesta - eso es bueno, significa que estás pensando críticamente! ✏️

Sin embargo, si sientes que no estás seguro de cómo empezar:

• Comienza con una versión simple y mejórala gradualmente
• No te preocupes por la perfección en el primer intento
• Usa el ejemplo como plantilla y personalízalo a tu caso

¿Quieres que veamos juntos un ejemplo similar al que estás intentando crear?`,
      suggestions: [
        'Empieza con una versión simple',
        'Usa el ejemplo como plantilla',
        'Mejora gradualmente en lugar de borrar todo'
      ]
    },
    repetitive_cycles: {
      success: true,
      response: `Noto que has vuelto atrás varias veces. Esto puede indicar que algo no quedó claro en una sección anterior.

Te sugiero:

• Identificar exactamente qué concepto te genera dudas
• Revisar ese concepto específico con más calma
• Preguntarme sobre esa parte en particular

¿Qué sección te gustaría que repasemos con más detalle?`,
      suggestions: [
        'Identifica qué concepto específico te confunde',
        'Revisa solo esa sección con más atención',
        'Pregúntame sobre ese concepto en particular'
      ]
    },
    erroneous_clicks: {
      success: true,
      response: `He notado algunos clicks que no parecen estar respondiendo. A veces la interfaz puede ser un poco confusa.

Algunas cosas que puedes intentar:

• Refresca la página si un botón no responde
• Verifica que hayas completado todos los campos requeridos antes de enviar
• Si algo no funciona, házmelo saber - puedo guiarte por un camino alternativo

¿Hay algún botón o función específica que no esté funcionando como esperabas?`,
      suggestions: [
        'Refresca la página si algo no responde',
        'Verifica completar todos los campos',
        'Prueba con un navegador diferente si persiste'
      ]
    }
  };

  const defaultResponse: ProactiveHelpResponse = {
    success: true,
    response: `¡Hola! He notado que podrías necesitar un poco de ayuda con esta actividad. Estoy aquí para apoyarte. ¿Hay algo específico con lo que pueda ayudarte?`,
    suggestions: [
      'Revisa el material de la lección',
      'Pregúntame sobre conceptos específicos',
      'Intenta el ejercicio con un enfoque diferente'
    ]
  };

  return responses[primaryPattern?.type] || defaultResponse;
}
