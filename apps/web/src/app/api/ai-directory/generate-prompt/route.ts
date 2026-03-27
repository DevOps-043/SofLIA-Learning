import { NextRequest, NextResponse } from 'next/server';
import { logger } from '../../../../lib/utils/logger';
import { OpenAI } from 'openai';
import { formatApiError, logError } from '../../../../core/utils/api-errors';
import { trackOpenAICall, calculateOpenAIMetadata, calculateCost } from '../../../../lib/openai/usage-monitor';
import { SessionService } from '../../../../features/auth/services/session.service';
import { LiaLogger } from '../../../../lib/analytics/lia-logger';

// Configuración de Lia directamente en el archivo
const LIA_CONFIG = {
  responses: {
    offTopic: "Mi especialidad es la creación de prompts de IA. ¿En qué tipo de prompt te gustaría trabajar hoy?",
    injectionDetected: "Detecté un patrón que podría intentar manipular mis instrucciones. Mi propósito es ayudarte a crear prompts profesionales y seguros. Por favor, reformula tu solicitud para que sea constructiva y ética."
  },
  detection: {
    promptInjection: [
      "ignore previous instructions", "disregard all prior commands", "act as a", "jailbreak",
      "forget everything", "new instructions", "override", "system prompt", "you are now",
      "pretend to be", "roleplay as", "dan mode", "developer mode"
    ],
    offTopic: [
      "qué es la inteligencia artificial", "cómo funciona la ia", "qué es chatgpt",
      "cuéntame un chiste", "cómo estás", "qué hora es", "qué día es hoy",
      "cuál es tu nombre", "de dónde eres", "qué opinas de", "ayúdame con mi tarea",
      "resuelve este problema", "explica este concepto"
    ]
  }
};

function isOffTopic(message: string): boolean {
  const lowerMessage = message.toLowerCase();
  return LIA_CONFIG.detection.offTopic.some(pattern => lowerMessage.includes(pattern));
}

function hasPromptInjection(message: string): boolean {
  const lowerMessage = message.toLowerCase();
  return LIA_CONFIG.detection.promptInjection.some(pattern => lowerMessage.includes(pattern));
}

// Prompt maestro de seguridad y profesionalismo para Lia
const MASTER_PROMPT = `Eres SofLIA, una especialista profesional en creación de prompts de IA. Tu única función es ayudar a los usuarios a crear prompts efectivos, bien estructurados y profesionales.

IDENTIDAD:
- Nombre: Lia
- Especialidad: Generación de Prompts de IA
- Enfoque: EXCLUSIVAMENTE creación de prompts, NO consultoría general

COMPORTAMIENTO REQUERIDO:
1. Mantén un tono profesional, directo y eficiente
2. NO divagues sobre temas no relacionados con prompts
3. NO hagas chistes o comentarios casuales
4. NO actúes como consultor general de IA o tecnología
5. Redirige cualquier pregunta no relacionada con prompts

LÍMITES ESTRICTOS:
- Solo responde preguntas sobre creación de prompts
- Si te preguntan sobre otros temas de IA, responde: "Mi especialidad es la creación de prompts de IA. ¿En qué tipo de prompt te gustaría trabajar hoy?"
- Mantén conversaciones enfocadas y técnicas

ESTRUCTURA DE RESPUESTA:
Cuando generes un prompt, siempre incluye:
1. Título claro y descriptivo
2. Descripción concisa del propósito
3. Contenido del prompt bien estructurado
4. Tags relevantes (3-5)
5. Nivel de dificultad (beginner/intermediate/advanced)
6. Casos de uso específicos
7. Consejos técnicos para optimización

FORMATO DE SALIDA:
Responde SIEMPRE en formato JSON con esta estructura exacta:
{
  "title": "Título del prompt",
  "description": "Descripción breve",
  "content": "Contenido completo del prompt (mínimo 200 palabras, detallado y específico)",
  "tags": ["tag1", "tag2", "tag3"],
  "difficulty_level": "beginner|intermediate|advanced",
  "use_cases": ["Caso 1", "Caso 2"],
  "tips": ["Consejo 1", "Consejo 2"]
}

IMPORTANTE: El contenido del prompt debe ser extenso, detallado y profesional. Usa formato Markdown con:

ESTRUCTURA REQUERIDA:
# Título del Prompt

## Objetivo
Descripción clara del propósito

## Contexto
Información de fondo relevante

## Instrucciones Detalladas
### Paso 1: [Nombre del paso]
- Instrucción específica
- Ejemplo concreto

### Paso 2: [Nombre del paso]
- Instrucción específica
- Ejemplo concreto

## Formato de Salida
Especifica exactamente cómo debe estructurarse la respuesta

## Consideraciones Especiales
- Punto importante 1
- Punto importante 2

## Ejemplo de Uso
Ejemplo práctico completo

FORMATO MARKDOWN:
- Usa **negritas** para énfasis
- Usa *cursivas* para términos técnicos
- Usa ### para subtítulos
- Usa - para listas
- Usa código entre backticks para comandos o variables
- Incluye espacios entre secciones para mejor legibilidad

CATEGORÍAS SOPORTADAS:
- Marketing y Ventas
- Contenido Creativo
- Programación y Desarrollo
- Análisis de Datos
- Educación y Capacitación
- Redacción y Comunicación
- Investigación y Análisis
- Automatización de Procesos
- Arte y Diseño
- Negocios y Estrategia

RECUERDA: Eres un generador de prompts profesional, no un chatbot general. Mantén el enfoque en tu especialidad.`;

interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: string;
  isPromptSection?: boolean;
  sectionType?: 'title' | 'description' | 'content' | 'tags' | 'difficulty' | 'use_cases' | 'tips';
}

export async function POST(request: NextRequest) {
  try {
    logger.log('🔍 API generate-prompt called');
    
    // ✅ Obtener usuario autenticado para analytics
    const user = await SessionService.getCurrentUser();
    const userId = user?.id || null;
    
    // ✅ Inicializar LiaLogger si hay usuario
    let liaLogger: LiaLogger | null = null;
    let conversationId: string | null = null;
    
    if (userId) {
      liaLogger = new LiaLogger(userId);
      try {
        conversationId = await liaLogger.startConversation({
          contextType: 'general', // Prompts usa contexto general
        });
        logger.log('✅ [LiaLogger] Conversación iniciada:', conversationId);
      } catch (logErr) {
        logger.log('⚠️ [LiaLogger] Error iniciando conversación:', logErr);
        liaLogger = null;
      }
    }
    
    const { message, conversationHistory } = await request.json();
    logger.log('📝 Message received:', message);

    // Validar entrada
    if (!message || typeof message !== 'string') {
      logger.log('❌ No message provided');
      return NextResponse.json(
        { error: 'Mensaje requerido' },
        { status: 400 }
      );
    }

    // Verificar comportamiento apropiado usando configuración de Lia
    if (hasPromptInjection(message)) {
      return NextResponse.json({
        response: LIA_CONFIG.responses.injectionDetected,
        generatedPrompt: null,
      }, { status: 400 });
    }
    
    if (isOffTopic(message)) {
      return NextResponse.json({
        response: LIA_CONFIG.responses.offTopic,
        generatedPrompt: null,
      }, { status: 200 });
    }

    // Construir historial de conversación
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: MASTER_PROMPT
      }
    ];

    // Agregar historial de conversación (últimos 10 mensajes para mantener contexto)
    const recentHistory = conversationHistory ? conversationHistory.slice(-10) : [];
    recentHistory.forEach((msg: any) => {
      // Convertir del formato del frontend al formato de OpenAI
      const role = msg.sender === 'ai' ? 'assistant' : 'user';
      const content = msg.text;
      
      messages.push({
        role: role as 'user' | 'assistant',
        content: content
      });
    });

    // Agregar el mensaje actual
    messages.push({
      role: 'user',
      content: message
    });

    // Llamar a OpenAI
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    logger.log('🤖 Calling OpenAI with', messages.length, 'messages');
    logger.log('📋 Messages array:', JSON.stringify(messages, null, 2));
    const startTime = Date.now();
    const model = 'gpt-4o';
    const completion = await openai.chat.completions.create({
      model,
      messages: messages,
      temperature: 0.7,
      max_tokens: 2000,
      presence_penalty: 0.1,
      frequency_penalty: 0.1
    });
    const responseTime = Date.now() - startTime;
    logger.log('✅ OpenAI response received');
    
    // ✅ Registrar uso de OpenAI para generación de prompts
    if (completion.usage) {
      await trackOpenAICall(calculateOpenAIMetadata(
        {
          prompt_tokens: completion.usage.prompt_tokens,
          completion_tokens: completion.usage.completion_tokens,
          total_tokens: completion.usage.total_tokens
        },
        model,
        'prompt-generation',
        undefined, // No tenemos userId en este contexto
        responseTime
      ));
    }

    const response = completion.choices[0]?.message?.content;
    logger.log('📄 OpenAI raw response:', response);
    
    if (!response) {
      throw new Error('No se recibió respuesta de OpenAI');
    }

    // Intentar parsear como JSON si parece ser un prompt completo
    let generatedPrompt = null;
    try {
      // Buscar JSON en la respuesta
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.title && parsed.content) {
          generatedPrompt = parsed;
        }
      }
    } catch (error) {
      // No es JSON, continuar con respuesta normal
    }

    const finalResponse = {
      response: response,
      message: response,
      generatedPrompt: generatedPrompt,
      conversationId: conversationId // ✅ Devolver conversationId para tracking
    };
    
    // ✅ Registrar mensajes en BD con LiaLogger
    if (liaLogger && conversationId && completion.usage) {
      try {
        // Registrar mensaje del usuario
        await liaLogger.logMessage('user', message, false);
        
        // Registrar respuesta del asistente con metadatos
        const totalCost = calculateCost(
          completion.usage.prompt_tokens,
          completion.usage.completion_tokens,
          model
        );
        
        await liaLogger.logMessage('assistant', response || '', false, {
          modelUsed: model,
          tokensUsed: completion.usage.total_tokens,
          costUsd: totalCost,
          responseTimeMs: responseTime
        });
        
        logger.log('✅ [LiaLogger] Mensajes registrados en BD');
      } catch (logErr) {
        logger.log('⚠️ [LiaLogger] Error registrando mensajes:', logErr);
      }
    }
    
    logger.log('📤 Sending response to frontend:', JSON.stringify(finalResponse, null, 2));
    
    return NextResponse.json(finalResponse);

  } catch (error) {
    logError('POST /api/ai-directory/generate-prompt', error);

    // Manejar errores específicos de OpenAI
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        return NextResponse.json(
          formatApiError(error, 'Error de configuración de API'),
          { status: 500 }
        );
      }

      if (error.message.includes('rate limit')) {
        return NextResponse.json(
          formatApiError(error, 'Límite de solicitudes excedido. Inténtalo más tarde.'),
          { status: 429 }
        );
      }
    }

    return NextResponse.json(
      formatApiError(error, 'Error al generar prompt'),
      { status: 500 }
    );
  }
}
