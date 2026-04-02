/**
 * API Endpoint: Study Planner Dashboard Chat
 * POST /api/study-planner/dashboard/chat
 */

import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { SessionService } from '../../../../../features/auth/services/session.service';
import { logger } from '../../../../../lib/utils/logger';
import { SofLIALogger } from '../../../../../lib/analytics/lia-logger';
import { calculateCost, logOpenAIUsage } from '../../../../../lib/openai/usage-monitor';
import { executeMoveSession, executeDeleteSession, executeResizeSession, executeCreateSession, executeUpdateSession } from './actions/session-actions.service';
import { executeListCalendarEvents, executeCreateCalendarEvent, executeMoveCalendarEvent, executeDeleteCalendarEvent } from './actions/calendar-actions.service';
import { executeCreateMicroSession, executeRecoverMissedSession, executeRebalancePlan, executeReduceSessionLoad, executeUpdateCalendarSelection } from './actions/planning-actions.service';
import { getPlanContext } from './context.service';
import { setCurrentTimezone, getCurrentTimezone } from './format.utils';
import type { ActionType, ActionResult, ChatRequest, ChatResponse } from './types';

// Instrucciones base mínimas para LIA (sin prompt maestro gigante)
const BASE_LIA_INSTRUCTION = `Eres LIA, coach inteligente de estudios.
TU OBJETIVO: Maximizar el cumplimiento del plan de estudios del usuario.
TU SUPERPODER: Proactividad. No esperes a que te pregunten. Si ves un problema, propón una solución.

ACCIONES DISPONIBLES (usa tags <action>JSON</action>):
- rebalance_plan: Redistribuir sesiones atrasadas en la semana
- move_session: Mover una sesión a otro horario
- delete_session: Eliminar una sesión
- create_session: Crear nueva sesión
- recover_missed_session: Reprogramar sesión perdida
- reduce_session_load: Reducir carga de un día
- update_calendar_selection: Cambiar qué calendarios se consideran para disponibilidad

FORMATO OBLIGATORIO DE ACCIÓN (siempre incluir "type" y "data"):
<action>{"type": "rebalance_plan", "data": {}}</action>
<action>{"type": "move_session", "data": {"sessionId": "uuid", "newStartTime": "ISO", "newEndTime": "ISO"}}</action>
<action>{"type": "update_calendar_selection", "data": {"selectedCalendarIds": ["id1", "id2"]}}</action>

REGLAS DE ORO:
1. SIEMPRE incluir "type" en el JSON de la acción
2. Si no hay acción, NO uses el tag <action>
3. Si hay conflictos de horario: ¡AVISA Y PROPÓN CAMBIO!
4. Si hay sesiones perdidas: Pregunta si quiere reprogramar
5. Sé breve, directa y útil. Cero charla vacía
6. Usa Markdown (negritas) para datos clave
7. NO uses emojis
`;
function extractAction(response: string): { action: ActionResult | null; actions: ActionResult[]; cleanResponse: string } {
  logger.info(`🔍 Buscando tag(s) <action> en respuesta...`);
  logger.info(`📝 Respuesta recibida (primeros 500 chars): ${response.substring(0, 500)}`);

  // Buscar todas las acciones (soporte para múltiples)
  const actionMatches = response.matchAll(/<action>([\s\S]*?)<\/action>/g);
  const actions: ActionResult[] = [];

  for (const actionMatch of actionMatches) {
    try {
      const rawJson = actionMatch[1].trim();
      logger.info(`📋 JSON raw encontrado: ${rawJson.substring(0, 200)}`);

      const actionData = JSON.parse(rawJson);

      // VALIDAR que type existe y no es undefined
      if (!actionData.type) {
        logger.warn(`⚠️ Action sin type válido, ignorando: ${JSON.stringify(actionData).substring(0, 200)}`);
        continue; // Saltar esta acción inválida
      }

      const normalizedType = actionData.type.toLowerCase();
      logger.info(`✅ Acción encontrada: type=${normalizedType}, data=${JSON.stringify(actionData.data || {}).substring(0, 200)}`);

      actions.push({
        type: normalizedType as ActionType,
        data: actionData.data || {},
        status: actionData.confirmationNeeded ? 'confirmation_needed' : 'pending',
        message: actionData.confirmationMessage,
      });
    } catch (error) {
      logger.error('Error parsing action JSON:', error);
      logger.error(`JSON que falló: ${actionMatch[1]?.substring(0, 200)}`);
    }
  }

  if (actions.length === 0) {
    logger.info(`ℹ️ No se encontraron acciones válidas con \<action\> tags`);
    // Limpiar cualquier tag <action> mal formado de la respuesta
    const cleanResponse = response.replace(/<action>[\s\S]*?<\/action>/g, '').trim();
    return { action: null, actions: [], cleanResponse };
  }

  logger.info(`✅ ${actions.length} acción(es) válida(s) encontrada(s)`);
  const cleanResponse = response.replace(/<action>[\s\S]*?<\/action>/g, '').trim();

  // Para compatibilidad con código existente, retornar la primera acción como 'action'
  // pero también retornar todas en 'actions'
  return {
    action: actions[0],
    actions,
    cleanResponse,
  };
}
async function executeAction(
  userId: string,
  planId: string,
  action: ActionResult
): Promise<ActionResult> {
  switch (action.type) {
    // Session actions
    case 'move_session':      return executeMoveSession(userId, planId, action);
    case 'delete_session':    return executeDeleteSession(userId, planId, action);
    case 'resize_session':    return executeResizeSession(userId, planId, action);
    case 'create_session':    return executeCreateSession(userId, planId, action);
    case 'update_session':    return executeUpdateSession(userId, planId, action);
    // Calendar actions
    case 'list_calendar_events':   return executeListCalendarEvents(userId, planId, action);
    case 'create_calendar_event':  return executeCreateCalendarEvent(userId, planId, action);
    case 'move_calendar_event':    return executeMoveCalendarEvent(userId, planId, action);
    case 'delete_calendar_event':  return executeDeleteCalendarEvent(userId, planId, action);
    // Planning actions
    case 'create_micro_session':    return executeCreateMicroSession(userId, planId, action);
    case 'recover_missed_session':  return executeRecoverMissedSession(userId, planId, action);
    case 'rebalance_plan':          return executeRebalancePlan(userId, planId, action);
    case 'reduce_session_load':     return executeReduceSessionLoad(userId, planId, action);
    case 'update_calendar_selection': return executeUpdateCalendarSelection(userId, planId, action);
    // Aliases - LIA sometimes sends different action names
    case 'rebalance':
    case 'rebalanzar':
    case 'redistribuir':
      logger.info('🔄 Alias detectado para rebalance_plan, redirigiendo...');
      return executeRebalancePlan(userId, planId, { ...action, type: 'rebalance_plan' });
    default:
      logger.error(`❌ Tipo de acción no reconocido: "${action.type}"`);
      logger.error(`📋 Datos de la acción: ${JSON.stringify(action)}`);
      return { ...action, status: 'error', message: `Acción no reconocida: ${action.type}` };
  }
}

export async function POST(request: NextRequest): Promise<NextResponse<ChatResponse>> {
  try {
    // 1. Verificar autenticación
    const user = await SessionService.getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, response: '', error: 'Usuario no autenticado' },
        { status: 401 }
      );
    }

    // Inicializar LiaLogger para analytics
    const liaLogger = new SofLIALogger(user.id);
    let conversationId: string | undefined = undefined; // Será asignado más adelante

    const body: ChatRequest = await request.json();
    const { message, conversationHistory, activePlanId, trigger = 'user_message' } = body;

    const isProactiveInit = trigger === 'proactive_init' || (!message && !conversationHistory?.length);

    // Validación: Si no es proactivo, se requiere mensaje
    if (!isProactiveInit && !message?.trim()) {
      return NextResponse.json(
        { success: false, response: '', error: 'Mensaje requerido' },
        { status: 400 }
      );
    }

    // Iniciar conversación en logger
    try {
      const existingId = conversationHistory && conversationHistory.length > 0 ? undefined : undefined; // TODO: Manejar ID existente del frontend si se envía

      conversationId = await liaLogger.startConversation({
        contextType: 'study-planner' as any, // Forzamos el tipo aunque no esté en enum para que el logger lo maneje
        deviceType: request.headers.get('sec-ch-ua-platform') || undefined,
        ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0].trim()
      });

      // Si hay mensaje del usuario, registrarlo
      if (message) {
        await liaLogger.logMessage('user', message);
      }
    } catch (logError) {
      logger.warn('[StudyPlanner] Falló inicio de conversación logger:', logError);
      // Continuamos sin bloquear
    }

    // 3. Inicializar Google Gemini
    const googleApiKey = process.env.GOOGLE_API_KEY;
    if (!googleApiKey) {
      logger.error('❌ GOOGLE_API_KEY no configurada');
      return NextResponse.json({ success: false, response: '', error: 'Error de configuración de IA' }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(googleApiKey);

    // Configuración desde variables de entorno
    // IMPORTANTE: Solo usar modelos válidos de Gemini
    let modelName = process.env.GEMINI_MODEL || 'gemini-2.0-flash-exp';

    // Validar que el modelo sea uno conocido, sino usar el default
    const validModels = ['gemini-2.0-flash-exp', 'gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-pro'];
    if (!validModels.some(m => modelName.includes(m.split('-')[0]))) {
      logger.warn(`⚠️ Modelo "${modelName}" no reconocido, usando gemini-2.0-flash-exp`);
      modelName = 'gemini-2.0-flash-exp';
    }

    const temperature = parseFloat(process.env.GEMINI_TEMPERATURE || '0.7');
    const maxOutputTokens = parseInt(process.env.GEMINI_MAX_TOKENS || '8192');

    const model = genAI.getGenerativeModel({
      model: modelName,
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
        maxOutputTokens, // 8192
        temperature,     // 0.7
      }
    });

    // 4. Obtener contexto del plan
    const { context: planContext, syncResult, timezone } = await getPlanContext(user.id, activePlanId);

    setCurrentTimezone(timezone);

    // 5. Preparar historial
    const chatHistory = conversationHistory
      ?.slice(-10)
      .map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }]
      })) || [];

    // Validar historial para Gemini
    while (chatHistory.length > 0 && chatHistory[0].role === 'model') {
      chatHistory.shift();
    }

    // 6. Construcción Dinámica del Prompt (Sin Prompt Maestro estático)
    const now = new Date();
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit', timeZone: timezone,
    };
    const currentDateTime = now.toLocaleDateString('es-MX', options);

    // Construimos la instrucción del sistema en tiempo real con los datos frescos
    const dynamicSystemInstruction = `
${BASE_LIA_INSTRUCTION}

DATOS EN TIEMPO REAL:
- Fecha/Hora: ${currentDateTime} (Zona: ${timezone})
- Usuario ID: ${user.id}

ESTADO DEL PLAN Y CALENDARIO (CONTEXTO):
${planContext}

INSTRUCCIÓN ESPECIAL PARA ESTA INTERACCIÓN:
${isProactiveInit
        ? 'CONTEXTO: El usuario acaba de abrir el dashboard. NO ha enviado ningún mensaje aún. TÚ DEBES INICIAR LA CONVERSACIÓN.\nTAREA: Analiza el contexto de arriba (conflictos, atrasos, sesiones perdidas).\n- SI HAY PROBLEMAS: Pregunta DIRECTAMENTE al usuario si quiere resolverlos (ej: "Veo que perdiste la sesión X, ¿la reprogramamos?"). NO esperes a que él pregunte.\n- SI TODO ESTÁ BIEN: Saluda brevemente y menciona la próxima sesión.\n- IMPORTANTE: No digas "Hola" genérico. Ve genial contexto.'
        : 'El usuario ha respondido. Continúa la conversación ayudándole a gestionar su plan.'}
`;

    // 7. Iniciar Chat - systemInstruction debe ser un objeto con parts para versiones recientes del SDK
    const chatSession = model.startChat({
      history: chatHistory,
      systemInstruction: {
        role: 'user',
        parts: [{ text: dynamicSystemInstruction }]
      }
    });

    logger.info(`🤖 LIA (${trigger}): Analizando contexto con Gemini...`);

    try {
      // Si es proactivo, enviamos un input interno para detonar el análisis
      const userMessage = isProactiveInit
        ? 'Hola LIA, acabo de entrar. ¿Hay algo de mi plan que deba atender hoy?'
        : message!;

      const result = await chatSession.sendMessage(userMessage);
      // 7. Enviar respuesta
      const responseText = result.response.text();
      const usage = result.response.usageMetadata;

      // Registrar respuesta en logger (solo si la conversación se creó exitosamente)
      if (conversationId && liaLogger.getCurrentConversationId()) {
        // Calcular costos si hay metadata
        let usageMetadata = undefined;
        if (usage) {
          const promptTokens = usage.promptTokenCount || 0;
          const completionTokens = usage.candidatesTokenCount || 0;
          const totalTokens = usage.totalTokenCount || 0;

          const estimatedCost = calculateCost(promptTokens, completionTokens, modelName);

          // Registrar usage globalmente también
          if (user) {
            logOpenAIUsage({
              userId: user.id,
              timestamp: new Date(),
              model: modelName,
              promptTokens,
              completionTokens,
              totalTokens,
              estimatedCost
            });
          }

          usageMetadata = {
            tokensUsed: totalTokens,
            costUsd: estimatedCost,
            modelUsed: modelName
          };
        }

        try {
          await liaLogger.logMessage(
            'assistant',
            responseText,
            false,
            usageMetadata
          );
        } catch (logError: any) {
          // Solo loggear errores distintos a FK violation (23503) para evitar spam
          if (logError?.code !== '23503') {
            logger.warn('[StudyPlanner] Falló log de respuesta:', logError);
          }
        }
      }

      // 8. Procesar respuesta
      const { action, actions, cleanResponse } = extractAction(responseText);

      let executedAction: ActionResult | undefined;

      // Ejecutar acciones que no requieren confirmación (pending)
      if (actions.length > 0 && activePlanId) {
        const pendingActions = actions.filter(a => a.status === 'pending');
        const confirmationNeededActions = actions.filter(a => a.status === 'confirmation_needed');

        // Ejecutar secuencialmente las acciones pendientes
        if (pendingActions.length > 0) {
          logger.info(`⚡ Ejecutando ${pendingActions.length} acciones automáticas...`);
          const executionResults = await Promise.all(
            pendingActions.map(a => executeAction(user.id, activePlanId, a))
          );

          // Tomar la última ejecutada (o la primera fallida) para el retorno al frontend
          // (El frontend actual parece manejar solo una acción principal en el callback, 
          // aunque el chat muestre múltiples resultados textuales 'cleanResponse')
          const failedAction = executionResults.find(r => r.status === 'error');
          executedAction = failedAction || executionResults[executionResults.length - 1];
        }

        // Si hay una acción que requiere confirmación y no ejecutamos nada aún (o además),
        // la devolvemos para que el frontend pida confirmación.
        if (confirmationNeededActions.length > 0 && !executedAction) {
          executedAction = confirmationNeededActions[0];
        }
      } else if (action) {
        // Fallback legacy (si extractAction devolvió algo en single 'action' pero no en array, improbable con el código actual)
        executedAction = action;
      }

      return NextResponse.json({
        success: true,
        response: cleanResponse,
        action: executedAction,
      });

    } catch (apiError: any) {
      logger.error('❌ Error llamando a Gemini API:', apiError);

      // Fallback elegante en caso de sobrecarga o error de API
      return NextResponse.json({
        success: false,
        response: 'Lo siento, tuve un problema técnico momentáneo. ¿Podrías intentar de nuevo?',
        error: apiError.message
      });
    }

  } catch (error) {
    logger.error('Error crítico en chat del dashboard:', error);
    return NextResponse.json(
      {
        success: false,
        response: 'Ocurrió un error inesperado en el servidor.',
        error: error instanceof Error ? error.message : 'Error interno'
      },
      { status: 500 }
    );
  }
}
