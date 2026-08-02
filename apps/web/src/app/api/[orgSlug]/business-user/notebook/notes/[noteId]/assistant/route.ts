import { NextResponse } from 'next/server'
import { z } from 'zod'

import { fetchNotebookNote } from '@/features/notebook/services/notebook.server.service'
import { stripHtmlToText } from '@/features/notebook/services/notebook-enrichment.normalizer'
import { generateAiText } from '@/lib/ai/providers/ai-text-gateway.server'
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

    const result = await generateAiText({
      circuitBreakerName: 'notebook_assistant',
      history: conversation,
      prompt: message,
      purpose: 'notebook_assistant',
      // No administrable: la respuesta se parsea como JSON obligatoriamente.
      responseAsJson: true,
      systemInstruction: (profile: PromptModelProfile) =>
        buildNotebookAssistantInstruction(profile, note.title, noteText),
      timeoutMs: 25_000,
    })

    const output = parseAssistantOutput(result.text)
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
