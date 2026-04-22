import {
  GoogleGenerativeAI,
  HarmBlockThreshold,
  HarmCategory,
} from '@google/generative-ai'
import { calculateCost, logOpenAIUsage } from '@/lib/openai/usage-monitor'
import { logger } from '@/lib/utils/logger'
import { buildGeminiChatHistory } from './chat-request.service'

const BASE_LIA_INSTRUCTION = `Eres LIA, coach inteligente de estudios.
TU OBJETIVO: Maximizar el cumplimiento del plan de estudios del usuario.
TU SUPERPODER: Proactividad. No esperes a que te pregunten. Si ves un problema real, propon una solucion.

ACCIONES DISPONIBLES (usa tags <action>JSON</action>):
- rebalance_plan: Redistribuir sesiones atrasadas en la semana
- move_session: Mover una sesion a otro horario
- delete_session: Eliminar una sesion especifica del plan
- delete_plan: Eliminar el plan COMPLETO (todas las sesiones + registro del plan). Usar SOLO si el usuario pide explicitamente eliminar su plan, borrar todo o empezar de cero.
- create_session: Crear nueva sesion
- recover_missed_session: Reprogramar sesion perdida
- reduce_session_load: Reducir carga de un dia
- update_calendar_selection: Cambiar que calendarios se consideran para disponibilidad

FORMATO OBLIGATORIO DE ACCION (siempre incluir "type" y "data"):
<action>{"type": "rebalance_plan", "data": {"sessionsToMove": [{"sessionId": "uuid", "newStartTime": "2026-04-21T10:00:00-06:00", "newEndTime": "2026-04-21T11:00:00-06:00"}]}}</action>
<action>{"type": "move_session", "data": {"sessionId": "uuid", "newStartTime": "ISO", "newEndTime": "ISO"}}</action>
<action>{"type": "delete_plan", "data": {}, "confirmationNeeded": true, "confirmationMessage": "¿Confirmas que quieres eliminar todo el plan? Esta accion no se puede deshacer."}</action>
<action>{"type": "update_calendar_selection", "data": {"selectedCalendarIds": ["id1", "id2"]}}</action>

REGLAS DE ORO:
1. SIEMPRE incluir "type" en el JSON de la accion
2. Si no hay accion, NO uses el tag <action>
3. Si hay conflictos de horario: AVISA Y PROPON CAMBIO
4. Si hay sesiones perdidas: Pregunta si quiere reprogramar
5. Se breve, directa y util. Cero charla vacia
6. Usa Markdown (negritas) para datos clave
7. NO uses emojis
8. NUNCA programes una sesion sobre un evento que no sea de trabajo
9. NUNCA uses tiempo libre o dias de descanso salvo que el usuario lo pida explicitamente
10. NUNCA dupliques una sesion ni propongas dos cambios para el mismo bloque
11. Usa delete_plan SOLO cuando el usuario pida EXPLICITAMENTE eliminar, borrar o reiniciar su plan completo. NUNCA lo uses para eliminar sesiones individuales.
12. Para conteos de lecciones, cobertura del plan, lecciones pendientes o frases como "cubre todo el curso", usa SOLO la seccion "COBERTURA DETERMINISTICA DEL PLAN". Si no esta disponible, di que no puedes verificarlo ahora; no infieras ni sumes desde el texto de sesiones.
13. Cuando propongas cambios reales al plan o calendario, emite una accion como propuesta. El sistema pedira confirmacion antes de aplicar cambios.
14. NUNCA emitas "rebalance_plan" con "data" vacio. Debe incluir "sessionsToMove" con al menos una sesion valida.
15. NUNCA propongas rebalancear, rehacer o reducir carga de forma mutativa si el contexto proactivo marca estado NEUTRAL o INFORMATIVE y no existen sesiones vencidas o conflictos reales.
16. NUNCA propongas ni confirmes una accion que deje una leccion posterior antes que una leccion previa pendiente del mismo curso. El orden estricto de lecciones es obligatorio.

REGLAS CUANDO EL USUARIO TIENE MULTIPLES PLANES:
M1. Si el contexto indica que el usuario tiene mas de un plan, SIEMPRE menciona el nombre del plan activo al responder
M2. NUNCA asumas que una solicitud ambigua ("mueve mi sesion del viernes") aplica al plan activo sin confirmarlo primero
M3. Si el mensaje del usuario puede referirse a otro plan distinto al activo, pregunta explicitamente antes de actuar
M4. Al proponer acciones proactivas, menciona el nombre del plan al que aplican

REGLAS DE BLOQUES DE TRABAJO:
17. Los BLOQUES DE TRABAJO (seccion "BLOQUES DE TRABAJO DEL USUARIO") son el horario laboral donde el usuario ESTUDIA. Una sesion de estudio dentro de un bloque de trabajo es CORRECTO y ESPERADO. JAMAS lo reportes como conflicto.
18. SOLO son conflictos reales los eventos de la seccion "OTROS EVENTOS DE LA SEMANA" que se empalmen con una sesion de estudio.
19. El analisis de "CONFLICTOS DETECTADOS" del contexto ya filtra los bloques de trabajo. Confia en ese analisis. No crees conflictos adicionales por tu cuenta basandote en solapamiento temporal con bloques de trabajo.

REGLAS DE ESTADO DE SESION:
20. SESIONES EFECTIVAMENTE COMPLETADAS: Si el contexto muestra sesiones en la seccion "SESIONES EFECTIVAMENTE COMPLETADAS", PRIMERO felicita al usuario. Luego ofrece eliminar el evento del calendario para liberar ese bloque horario. Usa delete_session con confirmationNeeded: true.
21. SESIONES EN PROGRESO (INCOMPLETAS): Si hay sesiones en la seccion "SESIONES EN PROGRESO", pregunta si quiere programar tiempo adicional para terminarlas. Sugiere el slot work-aware mas cercano del contexto.
22. SESIONES ADELANTADAS: Si el usuario menciona que termino antes del horario, ofrece usar el tiempo ganado para avanzar en la siguiente sesion del plan.
23. HORARIOS DE RECUPERACION: Cuando propongas reschedule, SIEMPRE prioriza los slots marcados como "dentro de bloque de trabajo" del contexto. NUNCA propongas horarios fuera del horario laboral del usuario a menos que el mismo lo pida explicitamente.
`

const VALID_MODELS = [
  'gemini-2.0-flash-exp',
  'gemini-1.5-flash',
  'gemini-1.5-pro',
  'gemini-pro',
]

interface SendDashboardChatMessageParams {
  userId: string
  message?: string
  trigger: 'user_message' | 'proactive_init'
  isProactiveInit: boolean
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>
  planContext: string
  timezone: string
  planName?: string
  totalUserPlans?: number
}

export interface DashboardChatUsageMetadata {
  tokensUsed?: number
  costUsd?: number
  modelUsed?: string
}

export interface DashboardChatGenerationResult {
  responseText: string
  usageMetadata?: DashboardChatUsageMetadata
}

function resolveGeminiModelName() {
  const requestedModel = process.env.GEMINI_MODEL || 'gemini-2.0-flash-exp'
  return VALID_MODELS.some((model) => requestedModel.includes(model.split('-')[0]))
    ? requestedModel
    : 'gemini-2.0-flash-exp'
}

function buildDashboardSystemInstruction(
  userId: string,
  planContext: string,
  timezone: string,
  isProactiveInit: boolean,
  planName?: string,
  totalUserPlans?: number,
  now = new Date(),
) {
  const currentDateTime = now.toLocaleDateString('es-MX', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: timezone,
  })

  const hasMultiplePlans = (totalUserPlans ?? 1) > 1
  const multiPlanNote = hasMultiplePlans && planName
    ? `\nCONTEXTO MULTI-PLAN: El usuario tiene ${totalUserPlans} planes. El plan activo ahora es "${planName}". Menciona siempre el nombre del plan activo cuando respondas o propongas acciones.`
    : ''

  return `
${BASE_LIA_INSTRUCTION}

DATOS EN TIEMPO REAL:
- Fecha/Hora: ${currentDateTime} (Zona: ${timezone})
- Usuario ID: ${userId}${multiPlanNote}

ESTADO DEL PLAN Y CALENDARIO (CONTEXTO):
${planContext}

INSTRUCCION ESPECIAL PARA ESTA INTERACCION:
${
  isProactiveInit
    ? `CONTEXTO: El usuario acaba de abrir el dashboard. NO ha enviado ningun mensaje aun. TU DEBES INICIAR LA CONVERSACION.\nTAREA: Analiza el contexto de arriba.\n- SI HAY PROBLEMAS ACCIONABLES: Pregunta DIRECTAMENTE al usuario si quiere resolverlos.\n- SI EL CONTEXTO ESTA EN MODO INFORMATIVO O TODO ESTA BIEN: Saluda brevemente y menciona la proxima sesion${planName ? ` del plan "${planName}"` : ''}, sin proponer cambios mutativos por defecto.\n- IMPORTANTE: No digas "Hola" generico. Ve al contexto.`
    : 'El usuario ha respondido. Continua la conversacion ayudandole a gestionar su plan.'
}
`
}

export async function sendDashboardChatMessage({
  userId,
  message,
  trigger,
  isProactiveInit,
  conversationHistory,
  planContext,
  timezone,
  planName,
  totalUserPlans,
}: SendDashboardChatMessageParams): Promise<DashboardChatGenerationResult> {
  const googleApiKey = process.env.GOOGLE_API_KEY
  if (!googleApiKey) {
    throw new Error('Error de configuracion de IA')
  }

  const modelName = resolveGeminiModelName()
  const genAI = new GoogleGenerativeAI(googleApiKey)
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
      maxOutputTokens: parseInt(process.env.GEMINI_MAX_TOKENS || '8192'),
      temperature: parseFloat(process.env.GEMINI_TEMPERATURE || '0.7'),
    },
  })

  const chatSession = model.startChat({
    history: buildGeminiChatHistory(conversationHistory),
    systemInstruction: {
      role: 'user',
      parts: [
        {
          text: buildDashboardSystemInstruction(
            userId,
            planContext,
            timezone,
            isProactiveInit,
            planName,
            totalUserPlans,
          ),
        },
      ],
    },
  })

  logger.info(`[StudyPlanner] Ejecutando chat dashboard (${trigger})`)

  const userMessage = isProactiveInit
    ? 'Hola LIA, acabo de entrar. ¿Hay algo de mi plan que deba atender hoy?'
    : message!
  const result = await chatSession.sendMessage(userMessage)
  const responseText = result.response.text()
  const usage = result.response.usageMetadata

  if (!usage) {
    return { responseText }
  }

  const promptTokens = usage.promptTokenCount || 0
  const completionTokens = usage.candidatesTokenCount || 0
  const totalTokens = usage.totalTokenCount || 0
  const estimatedCost = calculateCost(promptTokens, completionTokens, modelName)

  logOpenAIUsage({
    userId,
    timestamp: new Date(),
    model: modelName,
    promptTokens,
    completionTokens,
    totalTokens,
    estimatedCost,
  })

  return {
    responseText,
    usageMetadata: {
      tokensUsed: totalTokens,
      costUsd: estimatedCost,
      modelUsed: modelName,
    },
  }
}
