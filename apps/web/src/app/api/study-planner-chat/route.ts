/**
 * API Route exclusiva para el Planificador de Estudios - LIA
 * 
 * Este endpoint está completamente separado del ai-chat general
 * para manejar de forma específica las interacciones con el planificador.
 * 
 * Utiliza Gemini 2.0 Flash de Google directamente SIN filtros de prompt-leak.
 */

import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

// Logger simple
const logger = {
    info: (...args: unknown[]) => console.log('[STUDY-PLANNER-API]', ...args),
    warn: (...args: unknown[]) => console.warn('[STUDY-PLANNER-API]', ...args),
    error: (...args: unknown[]) => console.error('[STUDY-PLANNER-API]', ...args)
};

// Inicializar cliente de Google Gemini
const googleApiKey = process.env.GOOGLE_API_KEY;
let genAI: GoogleGenerativeAI | null = null;

if (googleApiKey) {
    genAI = new GoogleGenerativeAI(googleApiKey);
    logger.info('✅ Google Gemini API inicializada para Study Planner');
} else {
    logger.error('❌ GOOGLE_API_KEY no está configurada');
}

// Tipos
interface ChatMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

interface StudyPlannerRequest {
    message: string;
    conversationHistory?: ChatMessage[];
    systemPrompt: string;
    userId?: string;
    userName?: string;
}

/**
 * Handler principal para el chat del planificador de estudios
 */
export async function POST(request: NextRequest) {
    try {
        logger.info('📥 Recibida solicitud de Study Planner Chat');

        // Verificar que Gemini está disponible
        if (!genAI) {
            logger.error('Gemini API no está inicializada');
            return NextResponse.json(
                { error: 'Servicio de IA no disponible' },
                { status: 503 }
            );
        }

        // Parsear el body con manejo de errores
        let body: StudyPlannerRequest;
        try {
            body = await request.json() as StudyPlannerRequest;
        } catch (parseError) {
            logger.error('❌ Error parseando body de la solicitud:', parseError);
            return NextResponse.json(
                { error: 'Body de solicitud inválido o vacío' },
                { status: 400 }
            );
        }

        const { message, conversationHistory = [], systemPrompt, userId, userName } = body;

        logger.info('📝 Mensaje recibido:', message?.substring(0, 100));
        logger.info('📚 Historial de conversación:', conversationHistory.length, 'mensajes');
        logger.info('👤 Usuario:', userName || userId || 'Anónimo');

        if (!message) {
            return NextResponse.json(
                { error: 'Se requiere un mensaje' },
                { status: 400 }
            );
        }

        if (!systemPrompt) {
            return NextResponse.json(
                { error: 'Se requiere el prompt del sistema' },
                { status: 400 }
            );
        }

        // Configurar el modelo con safety settings relajados para el planificador
        const model = genAI.getGenerativeModel({
            model: 'gemini-2.0-flash',
            safetySettings: [
                {
                    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
                    threshold: HarmBlockThreshold.BLOCK_NONE,
                },
                {
                    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
                    threshold: HarmBlockThreshold.BLOCK_NONE,
                },
                {
                    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
                    threshold: HarmBlockThreshold.BLOCK_NONE,
                },
                {
                    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
                    threshold: HarmBlockThreshold.BLOCK_NONE,
                },
            ],
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 4096,
                topP: 0.95,
                topK: 40,
            },
        });

        logger.info('🚀 Iniciando chat con Gemini 2.0 Flash...');

        // Construir el historial para Gemini, filtrando mensajes vacíos o inválidos
        const geminiHistory = conversationHistory
            .filter(msg => msg.content && msg.content.trim() !== '') // IMPORTANTE: Filtrar vacíos
            .map(msg => ({
                role: msg.role === 'assistant' ? 'model' as const : 'user' as const,
                parts: [{ text: msg.content }]
            }));

        // Log para debug
        if (geminiHistory.length > 0) {
            logger.info('🔍 Primer mensaje del historial a enviar:', JSON.stringify(geminiHistory[0]).substring(0, 100));
        }

        // Iniciar chat con el historial
        const chat = model.startChat({
            history: [
                // Añadir el system prompt como primer mensaje del modelo
                {
                    role: 'user',
                    parts: [{ text: 'Instrucciones del sistema para esta conversación:' }]
                },
                {
                    role: 'model',
                    parts: [{ text: 'Entendido. He leído y memorizado las siguientes instrucciones que seguiré durante toda la conversación.' }]
                },
                {
                    role: 'user',
                    parts: [{ text: systemPrompt }]
                },
                {
                    role: 'model',
                    parts: [{ text: 'Perfecto, he internalizado todas las instrucciones. Estoy listo para ayudar como SofLIA, el asistente del Planificador de Estudios. Responderé en español, de forma natural y amigable, siguiendo todas las reglas establecidas.' }]
                },
                // Añadir el historial de conversación real
                ...geminiHistory
            ],
        });

        // Enviar el mensaje y obtener la respuesta
        const result = await chat.sendMessage(message);
        const response = await result.response;

        // Manejar posible bug de Node.js con TransformStreams
        let responseText: string;
        try {
            responseText = response.text();
        } catch (textError) {
            logger.warn('⚠️ Error obteniendo texto con .text(), intentando alternativa:', textError);
            // Fallback: acceder directamente a los candidates
            const candidates = response.candidates;
            if (candidates && candidates.length > 0 && candidates[0].content?.parts?.[0]?.text) {
                responseText = candidates[0].content.parts[0].text;
            } else {
                throw new Error('No se pudo extraer el texto de la respuesta de Gemini');
            }
        }

        logger.info('✅ Respuesta recibida de Gemini');
        logger.info('📄 Longitud de respuesta:', responseText.length, 'caracteres');
        logger.info('📄 Primeros 500 caracteres:', responseText.substring(0, 500));

        // ⚠️ NO aplicamos filtro aquí - queremos ver exactamente qué devuelve el modelo
        // Si hay problemas, los manejaremos ajustando el prompt, no filtrando

        return NextResponse.json({
            response: responseText,
            model: 'gemini-2.0-flash',
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        logger.error('❌ Error en Study Planner Chat:', error);

        const errorMessage = error instanceof Error ? error.message : 'Error desconocido';

        return NextResponse.json(
            {
                error: 'Error al procesar la solicitud',
                details: errorMessage
            },
            { status: 500 }
        );
    }
}

/**
 * Endpoint GET para verificar que la API está funcionando
 */
export async function GET() {
    return NextResponse.json({
        status: 'ok',
        service: 'Study Planner Chat API',
        geminiAvailable: !!genAI,
        timestamp: new Date().toISOString()
    });
}
