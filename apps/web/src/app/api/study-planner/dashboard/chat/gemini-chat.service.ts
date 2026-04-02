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
TU SUPERPODER: Proactividad. No esperes a que te pregunten. Si ves un problema, propon una solucion.

ACCIONES DISPONIBLES (usa tags <action>JSON</action>):
- rebalance_plan: Redistribuir sesiones atrasadas en la semana
- move_session: Mover una sesion a otro horario
- delete_session: Eliminar una sesion
- create_session: Crear nueva sesion
- recover_missed_session: Reprogramar sesion perdida
- reduce_session_load: Reducir carga de un dia
- update_calendar_selection: Cambiar que calendarios se consideran para disponibilidad

FORMATO OBLIGATORIO DE ACCION (siempre incluir "type" y "data"):
<action>{"type": "rebalance_plan", "data": {}}</action>
<action>{"type": "move_session", "data": {"sessionId": "uuid", "newStartTime": "ISO", "newEndTime": "ISO"}}</action>
<action>{"type": "update_calendar_selection", "data": {"selectedCalendarIds": ["id1", "id2"]}}</action>

REGLAS DE ORO:
1. SIEMPRE incluir "type" en el JSON de la accion
2. Si no hay accion, NO uses el tag <action>
3. Si hay conflictos de horario: AVISA Y PROPON CAMBIO
4. Si hay sesiones perdidas: Pregunta si quiere reprogramar
5. Se breve, directa y util. Cero charla vacia
6. Usa Markdown (negritas) para datos clave
7. NO uses emojis
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

  return `
${BASE_LIA_INSTRUCTION}

DATOS EN TIEMPO REAL:
- Fecha/Hora: ${currentDateTime} (Zona: ${timezone})
- Usuario ID: ${userId}

ESTADO DEL PLAN Y CALENDARIO (CONTEXTO):
${planContext}

INSTRUCCION ESPECIAL PARA ESTA INTERACCION:
${
  isProactiveInit
    ? 'CONTEXTO: El usuario acaba de abrir el dashboard. NO ha enviado ningun mensaje aun. TU DEBES INICIAR LA CONVERSACION.\nTAREA: Analiza el contexto de arriba.\n- SI HAY PROBLEMAS: Pregunta DIRECTAMENTE al usuario si quiere resolverlos.\n- SI TODO ESTA BIEN: Saluda brevemente y menciona la proxima sesion.\n- IMPORTANTE: No digas "Hola" generico. Ve al contexto.'
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
