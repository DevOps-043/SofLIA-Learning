import { NextResponse } from 'next/server'
import { z } from 'zod'

import { fetchNotebookNote } from '@/features/notebook/services/notebook.server.service'
import { stripHtmlToText } from '@/features/notebook/services/notebook-enrichment.normalizer'
import { describeAiProviderError } from '@/lib/ai/ai-error'
import { getAiModelSettings } from '@/lib/ai/model-settings/ai-model-settings.server.service'
import { generateAiText } from '@/lib/ai/providers/ai-text-gateway.server'
import { scaleTimeoutForReasoning } from '@/lib/ai/providers/reasoning-budget'
import type { PromptModelProfile } from '@/lib/ai/prompts'
import type { AiTurn } from '@/lib/ai/providers'
import { normalizeNoteContentHtml } from '@/lib/notes/generated-note-html'
import { evaluatePromptInjectionRisk } from '@/lib/security/prompt-injection-detector'
import { logger } from '@/lib/utils/logger'

import { notebookErrorResponse, resolveNotebookAuth } from '../../../_shared'
import { buildNotebookAssistantInstruction } from './assistant-prompt'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const NOTE_CONTEXT_MAX = 8_000
const HISTORY_MAX_TURNS = 8
const PROPOSED_CONTENT_MAX = 60_000

/**
 * Espera base y techo de la llamada al modelo.
 *
 * El techo lo fija el producto, no el proveedor: el usuario esta mirando el
 * panel del apunte esperando la respuesta. La base se amplia cuando el modelo
 * razona internamente (toda la familia `gemini-3.x` y los modelos de
 * razonamiento de OpenAI), porque en ellos el pensamiento ocurre ANTES del
 * primer caracter visible y una espera calibrada con modelos inmediatos aborta
 * la llamada a mitad de razonamiento.
 */
const BASE_AI_TIMEOUT_MS = 25_000
const MAX_AI_TIMEOUT_MS = 55_000

/** Mensaje al usuario cuando el proveedor de IA no pudo atender el turno. */
const AI_UNAVAILABLE_MESSAGE =
  'SofLIA no pudo responder en este momento. Vuelve a intentarlo en unos segundos.'

interface AssistantOutput {
  reply: string
  proposedContent: string | null
}

/**
 * Parsea la salida JSON del modelo de forma defensiva. Si no es JSON válido,
 * degrada a mostrar el texto como respuesta sin propuesta de edición. El HTML
 * propuesto se normaliza/sanitiza (defensa en profundidad) antes de devolverlo.
 */
function parseAssistantOutput(raw: string): AssistantOutput {
  const text = raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '')
  try {
    const parsed: unknown = JSON.parse(text)
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      const record = parsed as Record<string, unknown>
      const reply =
        typeof record.reply === 'string' && record.reply.trim()
          ? record.reply.trim()
          : 'Listo.'
      const proposedRaw =
        typeof record.proposedContent === 'string' &&
        record.proposedContent.trim()
          ? record.proposedContent.slice(0, PROPOSED_CONTENT_MAX)
          : null
      const proposedContent = proposedRaw
        ? normalizeNoteContentHtml(proposedRaw) || null
        : null
      return { proposedContent, reply }
    }
  } catch {
    // No era JSON: se trata como respuesta de texto plano.
  }
  return { proposedContent: null, reply: text || 'Listo.' }
}

const assistantSchema = z.object({
  message: z.string().trim().min(1).max(2_000),
  history: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string().trim().min(1).max(4_000),
      }),
    )
    .max(HISTORY_MAX_TURNS)
    .optional(),
})

/**
 * SofLIA lee el apunte y responde preguntas o sugiere mejoras (Fase 1: solo
 * texto; el usuario aplica los cambios). El contenido de la nota se enmarca
 * como datos no confiables y se escanea contra prompt injection.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ orgSlug: string; noteId: string }> },
) {
  try {
    const { orgSlug, noteId } = await params
    const auth = await resolveNotebookAuth(orgSlug)
    if (auth instanceof NextResponse) return auth

    const parsedBody = assistantSchema.safeParse(
      await request.json().catch(() => null),
    )
    if (!parsedBody.success) {
      return NextResponse.json({ error: 'Petición inválida.' }, { status: 422 })
    }
    const { message, history = [] } = parsedBody.data

    const note = await fetchNotebookNote({
      userId: auth.userId,
      organizationId: auth.organizationId,
      noteId,
    })
    const noteText = stripHtmlToText(note.content).slice(0, NOTE_CONTEXT_MAX)

    // El mensaje del usuario y el contenido de la nota son entradas no
    // confiables: se escanean juntos antes de llegar al modelo.
    const risk = evaluatePromptInjectionRisk({
      message: `${message}\n${noteText}`,
    })
    if (risk.action === 'block') {
      return NextResponse.json(
        { error: 'No puedo procesar ese contenido.' },
        { status: 422 },
      )
    }

    const conversation: AiTurn[] = history
      .slice(-HISTORY_MAX_TURNS)
      .map((turn) => ({
        parts: [{ text: turn.content, type: 'text' as const }],
        role: turn.role === 'assistant' ? 'assistant' : 'user',
      }))

    // El propósito ya está resuelto por el gateway; se lee aquí solo para
    // dimensionar la espera con el modelo REAL configurado en el panel, no con
    // el que hubiera cuando se escribió esta ruta.
    const settings = await getAiModelSettings('notebook_assistant')

    let result
    try {
      result = await generateAiText({
        circuitBreakerName: 'notebook_assistant',
        history: conversation,
        prompt: message,
        purpose: 'notebook_assistant',
        // No administrable: la respuesta se parsea como JSON obligatoriamente.
        responseAsJson: true,
        systemInstruction: (profile: PromptModelProfile) =>
          buildNotebookAssistantInstruction(profile, note.title, noteText),
        timeoutMs: scaleTimeoutForReasoning({
          baseTimeoutMs: BASE_AI_TIMEOUT_MS,
          maxTimeoutMs: MAX_AI_TIMEOUT_MS,
          model: settings.model,
          provider: settings.provider,
          thinkingLevel: settings.thinkingLevel,
        }),
      })
    } catch (aiError) {
      // Un fallo del proveedor (timeout, cuota, circuito abierto, credenciales)
      // NO es un error interno de la plataforma: se responde 503 para que el
      // panel muestre un mensaje accionable en lugar de "Error interno del
      // servidor", y se registra con los metadatos que permiten distinguir la
      // causa sin adivinar. Nunca se registra el contenido del apunte.
      const details = describeAiProviderError(aiError)
      logger.error('Notebook assistant AI request failed', {
        apiStatus: details.apiStatus,
        error: details.message,
        httpStatus: details.httpStatus,
        model: settings.model,
        provider: settings.provider,
        reason: details.reason,
        thinkingLevel: settings.thinkingLevel,
      })

      return NextResponse.json(
        { success: false, error: AI_UNAVAILABLE_MESSAGE },
        { headers: { 'Cache-Control': 'no-store' }, status: 503 },
      )
    }

    const output = parseAssistantOutput(result.text)

    // Respuesta cortada por presupuesto de tokens: el HTML propuesto está a
    // medias y aplicarlo mutilaría el apunte. Se conserva la respuesta en texto
    // y se descarta la propuesta de edición.
    if (result.truncated && output.proposedContent) {
      logger.warn('Notebook assistant response truncated; edit proposal dropped', {
        maxOutputTokens: settings.maxOutputTokens,
        model: settings.model,
        noteId,
      })

      return NextResponse.json(
        {
          proposedContent: null,
          reply:
            'La reescritura completa del apunte no cabe en una sola respuesta. ' +
            'Pídeme el cambio por secciones (por ejemplo, solo el resumen) y te lo propongo.',
        },
        { headers: { 'Cache-Control': 'no-store' } },
      )
    }

    return NextResponse.json(output, {
      headers: { 'Cache-Control': 'no-store' },
    })
  } catch (error) {
    logger.error('Notebook assistant error', {
      error: error instanceof Error ? error.message : error,
    })
    return notebookErrorResponse(error, 'assistant POST')
  }
}
