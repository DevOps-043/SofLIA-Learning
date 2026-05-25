import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';

import { apiError } from '@/lib/api/errors';
import { withZodBody } from '@/lib/api/with-validation';
import { logger as techDebtLogger } from '@/lib/utils/logger';
import {
  studyPlannerChatSchema,
  type StudyPlannerChatBody,
} from './schema';

const logger = {
  info: (...args: unknown[]) => techDebtLogger.info('[STUDY-PLANNER-API]', ...args),
  warn: (...args: unknown[]) => techDebtLogger.warn('[STUDY-PLANNER-API]', ...args),
  error: (...args: unknown[]) => techDebtLogger.error('[STUDY-PLANNER-API]', ...args),
};

const googleApiKey = process.env.GOOGLE_API_KEY;
let genAI: GoogleGenerativeAI | null = null;

if (googleApiKey) {
  genAI = new GoogleGenerativeAI(googleApiKey);
  logger.info('Google Gemini API inicializada para Study Planner');
} else {
  logger.error('GOOGLE_API_KEY no esta configurada');
}

/**
 * Handler principal para el chat del planificador de estudios.
 */
async function handlePost(
  _request: NextRequest,
  body: StudyPlannerChatBody,
) {
  try {
    logger.info('Recibida solicitud de Study Planner Chat');

    if (!genAI) {
      logger.error('Gemini API no esta inicializada');
      return apiError('AI_SERVICE_UNAVAILABLE', 'Servicio de IA no disponible', 503);
    }

    const {
      message,
      conversationHistory = [],
      systemPrompt,
      userId,
      userName,
    } = body;

    logger.info('Mensaje recibido:', message.substring(0, 100));
    logger.info('Historial de conversacion:', conversationHistory.length, 'mensajes');
    logger.info('Usuario:', userName || userId || 'Anonimo');

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
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
        maxOutputTokens: 8192,
        topP: 0.95,
        topK: 40,
      },
    });

    logger.info('Iniciando chat con Gemini 2.5 Flash...');

    const geminiHistory = conversationHistory
      .filter((msg) => msg.content && msg.content.trim() !== '')
      .map((msg) => ({
        role: msg.role === 'assistant' ? 'model' as const : 'user' as const,
        parts: [{ text: msg.content }],
      }));

    if (geminiHistory.length > 0) {
      logger.info(
        'Primer mensaje del historial a enviar:',
        JSON.stringify(geminiHistory[0]).substring(0, 100),
      );
    }

    const chat = model.startChat({
      history: [
        {
          role: 'user',
          parts: [{ text: 'Instrucciones del sistema para esta conversacion:' }],
        },
        {
          role: 'model',
          parts: [
            {
              text: 'Entendido. He leido y memorizado las siguientes instrucciones que seguire durante toda la conversacion.',
            },
          ],
        },
        {
          role: 'user',
          parts: [{ text: systemPrompt }],
        },
        {
          role: 'model',
          parts: [
            {
              text: 'Perfecto, he internalizado todas las instrucciones. Estoy lista para ayudar como SofLIA, la asistente del Planificador de Estudios. Respondere en espanol, de forma natural y amigable, siguiendo todas las reglas establecidas.',
            },
          ],
        },
        ...geminiHistory,
      ],
    });

    const result = await chat.sendMessage(message);
    const response = await result.response;

    let responseText: string;
    try {
      responseText = response.text();
    } catch (textError) {
      logger.warn('Error obteniendo texto con .text(), intentando alternativa:', textError);
      const candidates = response.candidates;
      if (candidates && candidates.length > 0 && candidates[0].content?.parts?.[0]?.text) {
        responseText = candidates[0].content.parts[0].text;
      } else {
        throw new Error('No se pudo extraer el texto de la respuesta de Gemini');
      }
    }

    logger.info('Respuesta recibida de Gemini');
    logger.info('Longitud de respuesta:', responseText.length, 'caracteres');
    logger.info('Primeros 500 caracteres:', responseText.substring(0, 500));

    return NextResponse.json({
      response: responseText,
      model: 'gemini-2.5-flash',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error en Study Planner Chat:', error);
    return apiError(
      'STUDY_PLANNER_CHAT_FAILED',
      'Error al procesar la solicitud',
      500,
    );
  }
}

export const POST = withZodBody(studyPlannerChatSchema, handlePost);

/**
 * Endpoint GET para verificar que la API esta funcionando.
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'Study Planner Chat API',
    geminiAvailable: !!genAI,
    timestamp: new Date().toISOString(),
  });
}
