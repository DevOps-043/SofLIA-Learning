/**
 * API Route: SofLIA Onboarding Chat
 * Endpoint para conversación por voz durante el onboarding
 */

import { NextRequest, NextResponse } from 'next/server';

interface OnboardingChatRequest {
  question: string;
  context: {
    isOnboarding: boolean;
    currentStep: number;
    totalSteps: number;
    conversationHistory: Array<{ role: string; content: string }>;
  };
  userName?: string;
  pageContext?: Record<string, unknown>;
}

export async function POST(request: NextRequest) {
  try {
    const body: OnboardingChatRequest = await request.json();
    
    const { question, context, userName, pageContext } = body;

    // Validaciones
    if (!question || !question.trim()) {
      return NextResponse.json(
        { error: 'La pregunta es requerida' },
        { status: 400 }
      );
    }

    // En lugar de llamar directamente a OpenAI desde aquí, delegamos en el endpoint
    // central `/api/ai-chat` que ya contiene el sistema completo de SofLIA y todo el
    // manejo de contexto/analytics. Esto hará que las respuestas usen el mismo
    // 'system prompt' y contexto rico que el resto de la plataforma.

    // Enviamos la pregunta y el contexto al endpoint central sin la instrucción
    // de clarificación automática para que SofLIA responda directamente.
    const aiChatResp = await fetch(new URL('/api/ai-chat', request.url).toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: question,
        context: 'onboarding',
        conversationHistory: context.conversationHistory || [],
        // Pasar userName y pageContext para personalización
        userName: userName,
        pageContext: pageContext,
        // Indicar idioma por defecto a 'es' (se puede ampliar si el frontend lo envía)
        language: 'es'
      }),
    });

    if (!aiChatResp.ok) {
      const errText = await aiChatResp.text().catch(() => 'Unknown error');
      throw new Error(`Error from /api/ai-chat: ${aiChatResp.status} - ${errText}`);
    }

    const aiData = await aiChatResp.json();

    // Pasamos la respuesta generada por el endpoint central
    return NextResponse.json({ success: true, response: aiData.response });

  } catch (error) {
    console.error('❌ Error en onboarding-chat:', error);
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
 * Construye un prompt específico para el onboarding
 */
function buildOnboardingPrompt(
  userQuestion: string,
  context: OnboardingChatRequest['context']
): string {
  return `Eres SofLIA, la asistente virtual de la plataforma SofLIA. Estás guiando a un nuevo usuario en su proceso de onboarding.

## CONTEXTO DEL ONBOARDING:
- Paso actual: ${context.currentStep} de ${context.totalSteps}
- El usuario está conociendo la plataforma por primera vez
- Acabas de presentarte y explicar las funcionalidades principales

## PREGUNTA DEL USUARIO:
"${userQuestion}"

## INSTRUCCIONES PARA TU RESPUESTA:
1. **Sé breve y conversacional** - Esta es una conversación por voz, no un texto largo
2. **Sé amigable y entusiasta** - El usuario está empezando su viaje de aprendizaje
3. **Responde específicamente a su pregunta** - No des información no solicitada
4. **Si pregunta sobre funcionalidades**, menciona brevemente dónde las encontrará
5. **Si pregunta sobre cursos o contenido**, genera entusiasmo sobre el aprendizaje práctico
6. **Si hace una pregunta técnica sobre IA**, da una respuesta clara pero simple
7. **Usa emojis ocasionalmente** para hacer la conversación más amigable (máximo 1-2)
8. **Mantén la respuesta en máximo 3-4 oraciones** - Recuerda que se leerá en voz alta

## EJEMPLOS DE BUEN ESTILO:
- Pregunta: "¿Qué tipo de cursos tienen?"
  Respuesta: "¡Tenemos cursos increíbles sobre IA! 🚀 Desde fundamentos hasta aplicaciones avanzadas como procesamiento de lenguaje natural y visión por computadora. Todos son muy prácticos con talleres y proyectos reales."

- Pregunta: "¿Puedes ayudarme con mis tareas?"
  Respuesta: "¡Por supuesto! Estoy aquí para ayudarte cuando necesites. Puedo explicarte conceptos, revisar tu código, darte ejemplos y guiarte paso a paso en tus proyectos. Solo pregúntame lo que necesites."

- Pregunta: "¿Cómo funciona el machine learning?"
  Respuesta: "Es como enseñarle a una computadora a aprender de ejemplos. En lugar de programar reglas específicas, le muestras muchos datos y ella encuentra patrones. Es la magia detrás de recomendaciones de Netflix o reconocimiento facial."

Ahora responde a la pregunta del usuario de manera conversacional y amigable:`;
}

/**
 * Llama a la API de SofLIA (OpenAI) con el prompt contextual
 */
async function callLIA(
  prompt: string, 
  conversationHistory: Array<{ role: string; content: string }>
): Promise<string> {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      console.warn('⚠️ OPENAI_API_KEY no configurada, usando respuesta simulada');
      return generateMockResponse();
    }

    // Construir mensajes incluyendo historial
    const messages = [
      {
        role: 'system',
        content: 'Eres SofLIA, la asistente virtual de la plataforma SofLIA. Eres amigable, entusiasta y especializada en IA. Respondes de manera conversacional y breve porque tus respuestas se leen en voz alta.',
      },
      ...conversationHistory.slice(-6), // Últimas 3 interacciones (6 mensajes)
      {
        role: 'user',
        content: prompt,
      },
    ];

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo-preview',
        messages,
        temperature: 0.8,
        max_tokens: 200, // Respuestas cortas para voz
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || 'Lo siento, no pude generar una respuesta.';

  } catch (error) {
    console.error('❌ Error llamando a OpenAI:', error);
    return generateMockResponse();
  }
}

/**
 * Genera una respuesta simulada cuando no está disponible OpenAI
 */
function generateMockResponse(): string {
  const responses = [
    '¡Genial pregunta! 🎯 En la plataforma encontrarás cursos desde nivel básico hasta avanzado sobre IA. Todo con proyectos prácticos para que aprendas haciendo.',
    '¡Me encanta que preguntes! 💡 Estoy aquí para ayudarte en todo momento. Ya sea con conceptos, código o cualquier duda que tengas sobre los cursos.',
    'Interesante pregunta. La plataforma está diseñada para que aprendas IA de manera práctica y efectiva. Tendrás acceso a talleres, comunidad y recursos constantemente actualizados.',
  ];
  
  return responses[Math.floor(Math.random() * responses.length)];
}
