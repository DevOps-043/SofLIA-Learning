import { z } from 'zod'

import type { createAdminClient } from '@/lib/supabase/admin'
import type { createClient } from '@/lib/supabase/server'
import type { Json } from '@/lib/supabase/types'
import { deepParseJsonValue, normalizeQuizQuestions } from '@/lib/course-content'
import type { RawQuizQuestion, NormalizedQuizQuestion } from '@/lib/course-content'
import { sanitizeHtml } from '@/lib/sanitize/html-sanitizer.core'
import { logger } from '@/lib/utils/logger'

import type { DialogueTranscriptRows } from './lesson-dialogue-transcript.builder'
import { buildDialogueTranscriptHtml } from './lesson-dialogue-transcript.builder'
import {
  buildDeterministicLessonAutoNoteHtml,
  buildLessonAutoNoteHtmlFromModel,
} from './lesson-auto-note-content.builder'
import type {
  RequiredQuizStatus,
  RequiredQuizStatusItem,
} from './quiz/required-quiz-status.service'

type SupabaseServerClient =
  | Awaited<ReturnType<typeof createClient>>
  | ReturnType<typeof createAdminClient>

interface FlexiblePostgrestBuilder {
  eq(column: string, value: unknown): FlexiblePostgrestBuilder
  in(column: string, values: readonly unknown[]): FlexiblePostgrestBuilder
  limit(count: number): FlexiblePostgrestBuilder
  order(column: string, options?: { ascending?: boolean }): FlexiblePostgrestBuilder
  returns<T>(): PromiseLike<{ data: T | null; error: { message: string } | null }>
  select(columns: string): FlexiblePostgrestBuilder
}

interface FlexibleSupabaseClient {
  from(table: string): FlexiblePostgrestBuilder
}

function fromFlexible(
  supabase: SupabaseServerClient,
  table: string,
): FlexiblePostgrestBuilder {
  return (supabase as unknown as FlexibleSupabaseClient).from(table)
}

export type LessonAutoNoteStatus = 'created' | 'updated' | 'skipped' | 'failed'

export interface LessonAutoNoteResult {
  error?: string
  noteId?: string
  quality?: 'ai' | 'deterministic'
  reason?: string
  status: LessonAutoNoteStatus
  warning?: string
}

export interface GenerateLessonAutoNoteInput {
  allowUpdate: boolean
  courseId: string
  courseTitle: string
  enrollmentId: string
  lessonId: string
  organizationId: string | null
  quizStatus: RequiredQuizStatus
  supabase: SupabaseServerClient
  userId: string
}

interface LessonRow {
  lesson_id: string
  lesson_title: string
  lesson_description: string | null
  transcript_content: string | null
  summary_content: string | null
}

interface ActivityRow {
  activity_id: string
  activity_title: string | null
  activity_description: string | null
  activity_type: string | null
  activity_content: unknown
  ai_prompts: unknown
  activity_order_index: number | null
  activity_config: unknown
  is_required: boolean | null
}

interface MaterialRow {
  material_id: string
  material_title: string | null
  material_description: string | null
  material_type: string | null
  content_data: unknown
  material_order_index: number | null
}

interface ActivitySubmissionRow {
  activity_id: string
  evidence_payload: Record<string, unknown> | null
  response_payload: Record<string, unknown>
  response_text: string | null
  status: string
  submission_id: string
  submitted_at: string | null
  updated_at: string | null
}

interface ActivityEvaluationRow {
  created_at: string
  feedback_payload: unknown
  result_status: string
  submission_id: string
}

interface DialogueSessionRow {
  session_id: string
  activity_id: string
  current_score: number | null
  criteria_met: string[] | null
  criteria_missing: string[] | null
  state: string
  completed_at: string | null
  updated_at: string | null
}

interface DialogueTurnRow {
  created_at?: string | null
  session_id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  turn_number: number
}

interface DialogueResultRow {
  session_id: string
  activity_id: string
  activity_result: string
  score: number | null
  student_feedback: string | null
  instructor_summary: string | null
  criteria_met: string[] | null
  criteria_missing: string[] | null
}

interface LiaConversationRow {
  conversation_id: string
  activity_id: string | null
  conversation_title: string | null
  total_user_messages: number | null
  updated_at: string | null
}

interface LiaMessageRow {
  conversation_id: string
  created_at?: string | null
  role: string
  content: string
  message_sequence: number
}

interface ExistingAutoNoteRow {
  note_id: string
  is_user_edited?: boolean | null
}

interface PersistLessonAutoNoteInput {
  allowUpdate: boolean
  content: string
  enrollmentId: string
  lessonId: string
  noteTitle: string
  organizationId: string | null
  supabase: SupabaseServerClient
  userId: string
}

export interface LessonAutoNotePromptInput {
  activityNotes: string[]
  courseTitle: string
  dialogueHighlights: string[]
  lessonDescription: string | null
  lessonSummary: string | null
  lessonTitle: string
  quizReviews: string[]
  transcript: string | null
}

export interface LessonAutoNotePersistenceDecision {
  action: 'create' | 'update' | 'skip'
  noteId?: string
}

const AUTO_NOTE_TAGS = ['SofLIA', 'Apunte automatico', 'Leccion']
const FALLBACK_MODEL = 'gemini-3.5-flash'
const MAX_NOTE_CONTENT = 50_000
// The AI summary gets a smaller cap so the remaining budget (~30k) can hold
// the verbatim dialogue transcript appended after it.
const AI_SUMMARY_MAX = 20_000
const TRANSCRIPT_SECTION_HEADING =
  '<h2>Conversación en crudo con SofLIA</h2>'
const TRANSCRIPT_SECTION_RESERVE = 500

const labeledItemSchema = z.object({
  detail: z.string().min(1).max(2_500),
  label: z.string().max(160),
})

const lessonAutoNoteDocumentSchema = z.object({
  activityFeedback: z.array(labeledItemSchema).max(8),
  lessonKeyPoints: z.array(labeledItemSchema).max(8),
  lessonOverview: z.array(z.string().min(1).max(2_500)).max(4),
  quizFeedback: z.array(labeledItemSchema).max(10),
  reviewChecklist: z.array(z.string().min(1).max(1_000)).max(8),
  sofliaHighlights: z.array(labeledItemSchema).max(8),
  strategicSummary: z.array(z.string().min(1).max(2_500)).min(1).max(4),
  titles: z.object({
    activityFeedback: z.string().min(1).max(120),
    index: z.string().min(1).max(80),
    lessonContent: z.string().min(1).max(120),
    quizFeedback: z.string().min(1).max(120),
    review: z.string().min(1).max(120),
    sofliaHighlights: z.string().min(1).max(160),
    summary: z.string().min(1).max(120),
  }),
})

const LESSON_AUTO_NOTE_JSON_SCHEMA: Record<string, unknown> = {
  $defs: {
    labeledItem: {
      additionalProperties: false,
      properties: { detail: { type: 'string' }, label: { type: 'string' } },
      required: ['detail', 'label'],
      type: 'object',
    },
  },
  additionalProperties: false,
  properties: {
    activityFeedback: { items: { $ref: '#/$defs/labeledItem' }, type: 'array' },
    lessonKeyPoints: { items: { $ref: '#/$defs/labeledItem' }, type: 'array' },
    lessonOverview: { items: { type: 'string' }, type: 'array' },
    quizFeedback: { items: { $ref: '#/$defs/labeledItem' }, type: 'array' },
    reviewChecklist: { items: { type: 'string' }, type: 'array' },
    sofliaHighlights: { items: { $ref: '#/$defs/labeledItem' }, type: 'array' },
    strategicSummary: { items: { type: 'string' }, minItems: 1, type: 'array' },
    titles: {
      additionalProperties: false,
      properties: {
        activityFeedback: { type: 'string' },
        index: { type: 'string' },
        lessonContent: { type: 'string' },
        quizFeedback: { type: 'string' },
        review: { type: 'string' },
        sofliaHighlights: { type: 'string' },
        summary: { type: 'string' },
      },
      required: [
        'activityFeedback',
        'index',
        'lessonContent',
        'quizFeedback',
        'review',
        'sofliaHighlights',
        'summary',
      ],
      type: 'object',
    },
  },
  required: [
    'activityFeedback',
    'lessonKeyPoints',
    'lessonOverview',
    'quizFeedback',
    'reviewChecklist',
    'sofliaHighlights',
    'strategicSummary',
    'titles',
  ],
  type: 'object',
}

function clip(value: string | null | undefined, maxLength: number): string {
  const normalized = (value || '').replace(/\s+/g, ' ').trim()
  if (normalized.length <= maxLength) return normalized
  return `${normalized.slice(0, maxLength).trim()}...`
}

function stripHtml(value: string): string {
  return value
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
}

/** Campos con texto pensado para el alumno dentro de payloads de actividades. */
const READABLE_CONTENT_KEYS = [
  'title',
  'introduction',
  'description',
  'instructions',
  'objective',
  'context',
  'scenario',
  'question',
  'prompt',
  'text',
  'message',
  'content',
  'body',
  'summary',
  'conclusion',
  'task',
  'goal',
] as const

/** Contenedores anidados que pueden envolver texto legible (p. ej. escenas de ai_chat). */
const READABLE_CONTAINER_KEYS = [
  'scenes',
  'messages',
  'steps',
  'items',
  'sections',
  'questions',
  'dialogue',
] as const

function stripMarkdownSyntax(value: string): string {
  return value
    .replace(/^#{1,6}\s+/u, '')
    .replace(/\s#{1,6}\s+/gu, '. ')
    .replace(/\*\*([^*]+)\*\*/gu, '$1')
    .replace(/`([^`]+)`/gu, '$1')
}

/**
 * Extracts learner-readable text from arbitrary payloads. Serialized JSON is
 * never emitted: it pollutes both the AI prompt and the deterministic note.
 */
function readableFromUnknown(value: unknown, depth = 0): string {
  if (typeof value === 'string') {
    return stripMarkdownSyntax(stripHtml(value)).trim()
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value)
  }
  if (!value || depth >= 3) {
    return ''
  }
  if (Array.isArray(value)) {
    return value
      .map((item) => readableFromUnknown(item, depth + 1))
      .filter(Boolean)
      .join(' ')
  }

  const record = toRecord(value)
  const known = READABLE_CONTENT_KEYS.map((key) =>
    readableFromUnknown(record[key], depth + 1),
  ).filter(Boolean)
  const nested = READABLE_CONTAINER_KEYS.map((key) =>
    readableFromUnknown(record[key], depth + 1),
  ).filter(Boolean)
  if (known.length > 0 || nested.length > 0) {
    return [...known, ...nested].join(' ')
  }

  return Object.values(record)
    .filter((item): item is string => typeof item === 'string')
    .map((item) => stripMarkdownSyntax(stripHtml(item)).trim())
    .filter(Boolean)
    .join(' ')
}

function compactUnknown(value: unknown, maxLength = 900): string {
  return clip(readableFromUnknown(value), maxLength)
}

function toRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {}
  }

  return value as Record<string, unknown>
}

function getRecordText(record: Record<string, unknown>): string {
  const candidates = [
    record.text,
    record.answer,
    record.response,
    record.reflection,
    record.summary,
  ]

  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim()) {
      return candidate.trim()
    }
  }

  const answers = record.answers
  if (answers && typeof answers === 'object' && !Array.isArray(answers)) {
    return Object.entries(answers as Record<string, unknown>)
      .map(([key, value]) => `${key}: ${compactUnknown(value, 240)}`)
      .filter(Boolean)
      .join('; ')
  }

  return compactUnknown(record, 900)
}

const PUBLIC_FEEDBACK_FIELDS = [
  'summary',
  'feedback',
  'student_feedback',
  'strengths',
  'improvements',
  'recommendations',
  'next_steps',
  'message',
] as const

/** Allows only learner-facing evaluation fields into notes and AI prompts. */
function getPublicFeedbackText(value: unknown): string {
  const record = toRecord(value)
  const parts = PUBLIC_FEEDBACK_FIELDS.flatMap((field) => {
    const candidate = record[field]
    if (typeof candidate === 'string') return [candidate]
    if (Array.isArray(candidate)) {
      return candidate.filter((item): item is string => typeof item === 'string')
    }
    return []
  })

  return clip(parts.join(' '), 900)
}

function normalizeForCompare(value: string): string {
  return value.trim().replace(/\s+/g, ' ').toLowerCase()
}

function answerToText(
  question: NormalizedQuizQuestion,
  answer: string | number | undefined,
): string {
  if (answer === undefined) return 'Sin respuesta'
  if (typeof answer === 'number') return question.options[answer] || String(answer)
  return answer
}

function isAnswerCorrect(
  question: NormalizedQuizQuestion,
  answer: string | number | undefined,
): boolean {
  if (answer === undefined) return false
  return normalizeForCompare(answerToText(question, answer)) ===
    normalizeForCompare(question.correctAnswer)
}

function parseQuizPayload(rawContent: unknown): NormalizedQuizQuestion[] {
  const parsed = deepParseJsonValue(rawContent)
  const rawQuestions =
    parsed &&
    typeof parsed === 'object' &&
    !Array.isArray(parsed) &&
    'questions' in parsed
      ? (parsed as { questions?: unknown }).questions
      : parsed

  if (!Array.isArray(rawQuestions)) {
    return []
  }

  return normalizeQuizQuestions(rawQuestions as RawQuizQuestion[])
}

function getQuizReviewLines(input: {
  quiz: RequiredQuizStatusItem
  rawContent: unknown
}): string[] {
  const questions = parseQuizPayload(input.rawContent)
  const answers = input.quiz.latestSubmission?.userAnswers || {}

  if (questions.length === 0) {
    return [
      `${input.quiz.title || 'Quiz'}: ${input.quiz.percentage}% (${input.quiz.isPassed ? 'aprobado' : 'no aprobado'}).`,
    ]
  }

  // Cada parte va en su propia línea: la nota determinista y el prompt de IA
  // deben mostrar pregunta, respuesta del alumno y respuesta correcta como
  // bloques separados, nunca como un párrafo corrido.
  return questions.map((question, index) => {
    const selectedAnswer = answers[question.id]
    const selectedText = answerToText(question, selectedAnswer)
    const correctness = isAnswerCorrect(question, selectedAnswer)
      ? 'correcta'
      : 'a revisar'

    return [
      `Pregunta ${index + 1} (${input.quiz.title || 'Quiz'}): ${clip(question.question, 260)}`,
      `Tu respuesta: ${clip(selectedText, 220)} (${correctness}).`,
      `Respuesta correcta: ${clip(question.correctAnswer, 220)}.`,
      question.explanation
        ? `Explicación: ${clip(question.explanation, 320)}`
        : '',
    ]
      .filter(Boolean)
      .join('\n')
  })
}

function formatMessages(messages: Array<{ role: string; content: string }>) {
  return messages
    .filter((message) => message.role === 'user' || message.role === 'assistant')
    .slice(-8)
    .map((message) => `${message.role === 'user' ? 'Usuario' : 'SofLIA'}: ${clip(message.content, 420)}`)
    .join('\n')
}

function latestEvaluationBySubmission(
  evaluations: ActivityEvaluationRow[],
): Map<string, ActivityEvaluationRow> {
  const map = new Map<string, ActivityEvaluationRow>()

  for (const evaluation of evaluations) {
    if (!map.has(evaluation.submission_id)) {
      map.set(evaluation.submission_id, evaluation)
    }
  }

  return map
}

export function resolveLessonAutoNotePersistenceDecision(input: {
  allowUpdate: boolean
  existingNoteId?: string | null
  existingUserEdited?: boolean | null
}): LessonAutoNotePersistenceDecision {
  if (!input.existingNoteId) {
    return { action: 'create' }
  }

  // Una auto-nota que el usuario editó a mano queda blindada: nunca se
  // sobrescribe con una regeneración, aunque allowUpdate sea true.
  if (input.existingUserEdited) {
    return { action: 'skip', noteId: input.existingNoteId }
  }

  if (!input.allowUpdate) {
    return { action: 'skip', noteId: input.existingNoteId }
  }

  return { action: 'update', noteId: input.existingNoteId }
}

export function buildLessonAutoNotePrompt(input: LessonAutoNotePromptInput): string {
  return `Genera un apunte automatico de leccion para SofLIA Learning.

Objetivo:
Crear una nota concisa, estrategica y util para que el usuario recuerde y aplique lo aprendido al completar la leccion, tenga o no quiz o conversacion.

Reglas estrictas:
- Responde unicamente con JSON valido que respete exactamente el esquema indicado abajo.
- No uses HTML, markdown, bloques de codigo, estilos, tablas ni enlaces inventados dentro de los textos.
- No inventes datos. Si falta contexto en una seccion, resume con lo disponible.
- No copies la conversacion completa con SofLIA; la transcripcion completa se añadira automaticamente despues de tu resumen.
- Usa de 1 a 3 parrafos breves en strategicSummary y lessonOverview.
- Usa de 3 a 6 elementos concretos en lessonKeyPoints, sofliaHighlights y reviewChecklist cuando haya contexto suficiente.
- Para activityFeedback y quizFeedback, usa label para el tema o pregunta y detail para la retroalimentacion accionable.
- Mantente conciso: entre 500 y 900 palabras.
- Tono profesional, claro y accionable.
- Idioma: usa el idioma principal del contenido; si no es claro, usa español. Traduce tambien todos los valores de titles a ese idioma.

Esquema JSON obligatorio:
{
  "titles": {
    "index": "Índice",
    "summary": "Resumen estratégico",
    "lessonContent": "Video, lectura y reflexión",
    "sofliaHighlights": "Puntos clave de mi interacción con SofLIA",
    "activityFeedback": "Retroalimentación de la actividad",
    "quizFeedback": "Retroalimentación del quiz",
    "review": "Para repasar"
  },
  "strategicSummary": ["párrafo"],
  "lessonOverview": ["párrafo"],
  "lessonKeyPoints": [{ "label": "concepto", "detail": "explicación" }],
  "sofliaHighlights": [{ "label": "hallazgo", "detail": "por qué importa" }],
  "activityFeedback": [{ "label": "actividad", "detail": "retroalimentación" }],
  "quizFeedback": [{ "label": "pregunta o concepto", "detail": "respuesta clave y explicación" }],
  "reviewChecklist": ["acción de repaso"]
}

Curso: ${input.courseTitle}
Leccion: ${input.lessonTitle}
Descripcion: ${clip(input.lessonDescription, 900) || 'Sin descripcion disponible.'}

Resumen existente de la leccion:
${clip(input.lessonSummary, 2500) || 'No hay resumen disponible.'}

Transcripcion / video:
${clip(input.transcript, 5500) || 'No hay transcripcion disponible.'}

Lecturas, reflexiones y entregas:
${input.activityNotes.length > 0 ? input.activityNotes.join('\n\n') : 'No hay entregas o lecturas adicionales disponibles.'}

Interacciones relevantes con SofLIA:
${input.dialogueHighlights.length > 0 ? input.dialogueHighlights.join('\n\n') : 'No hay interacciones SofLIA disponibles para esta leccion.'}

Quiz y retroalimentacion:
${input.quizReviews.length > 0 ? input.quizReviews.join('\n\n') : 'No hay detalle de quiz disponible.'}`
}

async function generateNoteHtml(input: {
  generation: GenerateLessonAutoNoteInput
  prompt: string
  untrustedText: string
}): Promise<string> {
  const { generateStructuredContent } = await import(
    '@/lib/ai/structured-generation.server'
  )
  const result = await generateStructuredContent({
    audit: {
      action: 'notebook_lesson_note_generated',
      actorId: input.generation.userId,
      organizationId: input.generation.organizationId,
      resourceId: input.generation.lessonId,
      resourceType: 'course_lesson',
    },
    jsonSchema: LESSON_AUTO_NOTE_JSON_SCHEMA,
    maxOutputTokens: 4_096,
    model: process.env.GEMINI_MODEL || FALLBACK_MODEL,
    operation: 'lesson_auto_note',
    prompt: input.prompt,
    schema: lessonAutoNoteDocumentSchema,
    temperature: 0.25,
    untrustedText: input.untrustedText,
  })
  const generatedHtml = buildLessonAutoNoteHtmlFromModel(
    JSON.stringify(result.value),
  )
  const sanitized = sanitizeHtml(generatedHtml, {
    level: 'rich',
    maxLength: AI_SUMMARY_MAX,
  }).trim()

  if (!sanitized) {
    throw new Error('SofLIA no devolvio contenido para el apunte.')
  }

  return sanitized
}

async function findExistingAutoNote(
  supabase: SupabaseServerClient,
  input: Pick<PersistLessonAutoNoteInput, 'enrollmentId' | 'lessonId' | 'userId'>,
): Promise<ExistingAutoNoteRow | null> {
  const { data, error } = await supabase
    .from('user_lesson_notes')
    .select('note_id, is_user_edited')
    .eq('user_id', input.userId)
    .eq('lesson_id', input.lessonId)
    .eq('enrollment_id', input.enrollmentId)
    .eq('source_type', 'lesson_auto_note')
    .eq('is_auto_generated', true)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle<ExistingAutoNoteRow>()

  if (error) {
    throw new Error(`Error consultando apunte automatico: ${error.message}`)
  }

  return data || null
}

async function persistLessonAutoNote(
  input: PersistLessonAutoNoteInput,
): Promise<LessonAutoNoteResult> {
  const now = new Date().toISOString()
  const existing = await findExistingAutoNote(input.supabase, input)
  const decision = resolveLessonAutoNotePersistenceDecision({
    allowUpdate: input.allowUpdate,
    existingNoteId: existing?.note_id,
    existingUserEdited: existing?.is_user_edited,
  })

  if (decision.action === 'skip') {
    return {
      noteId: decision.noteId,
      reason: existing?.is_user_edited
        ? 'AUTO_NOTE_USER_EDITED'
        : 'AUTO_NOTE_ALREADY_CURRENT',
      status: 'skipped',
    }
  }

  if (decision.action === 'update' && decision.noteId) {
    const { data, error } = await input.supabase
      .from('user_lesson_notes')
      .update({
        is_auto_generated: true,
        note_content: input.content,
        note_tags: AUTO_NOTE_TAGS as unknown as Json,
        note_title: input.noteTitle,
        source_type: 'lesson_auto_note',
        updated_at: now,
      })
      .eq('note_id', decision.noteId)
      .eq('user_id', input.userId)
      .select('note_id')
      .single<ExistingAutoNoteRow>()

    if (error || !data) {
      throw new Error(`Error actualizando apunte automatico: ${error?.message || 'sin respuesta'}`)
    }

    return { noteId: data.note_id, status: 'updated' }
  }

  const { data, error } = await input.supabase
    .from('user_lesson_notes')
    .insert({
      enrollment_id: input.enrollmentId,
      is_auto_generated: true,
      lesson_id: input.lessonId,
      note_content: input.content,
      note_tags: AUTO_NOTE_TAGS as unknown as Json,
      note_title: input.noteTitle,
      organization_id: input.organizationId,
      source_type: 'lesson_auto_note',
      updated_at: now,
      user_id: input.userId,
    })
    .select('note_id')
    .single<ExistingAutoNoteRow>()

  if (error || !data) {
    throw new Error(`Error creando apunte automatico: ${error?.message || 'sin respuesta'}`)
  }

  return { noteId: data.note_id, status: 'created' }
}

async function loadLessonRow(
  supabase: SupabaseServerClient,
  lessonId: string,
): Promise<LessonRow> {
  const { data, error } = await supabase
    .from('course_lessons')
    .select('lesson_id, lesson_title, lesson_description, transcript_content, summary_content')
    .eq('lesson_id', lessonId)
    .single<LessonRow>()

  if (error || !data) {
    throw new Error(`No fue posible cargar la leccion para el apunte: ${error?.message || 'no encontrada'}`)
  }

  return data
}

async function loadActivityEvaluations(
  supabase: SupabaseServerClient,
  submissionIds: string[],
): Promise<ActivityEvaluationRow[]> {
  if (submissionIds.length === 0) {
    return []
  }

  const { data } = await supabase
    .from('user_activity_evaluations')
    .select('submission_id, result_status, feedback_payload, created_at')
    .in('submission_id', submissionIds)
    .order('created_at', { ascending: false })
    .returns<ActivityEvaluationRow[]>()

  return data || []
}

async function loadLiaMessages(
  supabase: SupabaseServerClient,
  conversationIds: string[],
): Promise<LiaMessageRow[]> {
  if (conversationIds.length === 0) {
    return []
  }

  const { data } = await supabase
    .from('lia_messages')
    .select('conversation_id, role, content, message_sequence, created_at')
    .in('conversation_id', conversationIds)
    .eq('is_system_message', false)
    .order('message_sequence', { ascending: true })
    .returns<LiaMessageRow[]>()

  return data || []
}

async function loadDialogueTurns(
  supabase: SupabaseServerClient,
  sessionIds: string[],
): Promise<DialogueTurnRow[]> {
  if (sessionIds.length === 0) {
    return []
  }

  const { data } = await fromFlexible(supabase, 'soflia_dialogue_turns')
    .select('session_id, role, content, turn_number, created_at')
    .in('session_id', sessionIds)
    .order('turn_number', { ascending: true })
    .returns<DialogueTurnRow[]>()

  return data || []
}

async function loadDialogueResults(
  supabase: SupabaseServerClient,
  sessionIds: string[],
): Promise<DialogueResultRow[]> {
  if (sessionIds.length === 0) {
    return []
  }

  const { data } = await fromFlexible(supabase, 'soflia_dialogue_results')
    .select('session_id, activity_id, activity_result, score, student_feedback, criteria_met, criteria_missing')
    .in('session_id', sessionIds)
    .returns<DialogueResultRow[]>()

  return data || []
}

function buildActivityNotes(input: {
  activities: ActivityRow[]
  evaluations: ActivityEvaluationRow[]
  materials: MaterialRow[]
  submissions: ActivitySubmissionRow[]
}): string[] {
  const evaluationsBySubmission = latestEvaluationBySubmission(input.evaluations)

  const materialNotes = input.materials
    .filter((material) => material.material_type === 'reading')
    .map((material) =>
      [
        `Lectura/material: ${material.material_title || 'Sin titulo'}.`,
        material.material_description ? `Descripcion: ${clip(material.material_description, 500)}.` : '',
        compactUnknown(material.content_data, 1200),
      ]
        .filter(Boolean)
        .join(' '),
    )

  const activityNotes = input.activities
    .filter((activity) => activity.activity_type !== 'quiz')
    .map((activity) => {
      const submission = input.submissions.find(
        (item) => item.activity_id === activity.activity_id,
      )
      const evaluation = submission
        ? evaluationsBySubmission.get(submission.submission_id)
        : null
      const responseText =
        submission?.response_text ||
        getRecordText(toRecord(submission?.response_payload)) ||
        getRecordText(toRecord(submission?.evidence_payload))

      return [
        `Actividad: ${activity.activity_title || 'Sin titulo'} (${activity.activity_type || 'actividad'}).`,
        activity.activity_description ? `Descripcion: ${clip(activity.activity_description, 500)}.` : '',
        activity.activity_content ? `Contenido: ${compactUnknown(activity.activity_content, 900)}.` : '',
        responseText ? `Respuesta del usuario: ${clip(responseText, 900)}.` : '',
        evaluation && getPublicFeedbackText(evaluation.feedback_payload)
          ? `Evaluacion SofLIA: ${getPublicFeedbackText(evaluation.feedback_payload)}.`
          : '',
      ]
        .filter(Boolean)
        .join(' ')
    })

  return [...materialNotes, ...activityNotes].filter(Boolean).slice(0, 10)
}

function buildDialogueHighlights(input: {
  activities: ActivityRow[]
  dialogueResults: DialogueResultRow[]
  dialogueSessions: DialogueSessionRow[]
  dialogueTurns: DialogueTurnRow[]
  liaConversations: LiaConversationRow[]
  liaMessages: LiaMessageRow[]
}): string[] {
  const activityTitleById = new Map(
    input.activities.map((activity) => [
      activity.activity_id,
      activity.activity_title || 'Actividad',
    ]),
  )
  const resultsBySession = new Map(
    input.dialogueResults.map((result) => [result.session_id, result]),
  )

  const structuredHighlights = input.dialogueSessions.map((session) => {
    const result = resultsBySession.get(session.session_id)
    const turns = input.dialogueTurns
      .filter((turn) => turn.session_id === session.session_id)
      .map((turn) => ({ role: turn.role, content: turn.content }))

    return [
      `Dialogo guiado: ${activityTitleById.get(session.activity_id) || 'Actividad SofLIA'}.`,
      `Estado: ${session.state}; puntaje: ${result?.score ?? session.current_score ?? 0}.`,
      result?.student_feedback ? `Retroalimentacion: ${clip(result.student_feedback, 900)}.` : '',
      `Fragmentos clave:\n${formatMessages(turns)}`,
    ]
      .filter(Boolean)
      .join('\n')
  })

  const messagesByConversation = new Map<string, LiaMessageRow[]>()
  for (const message of input.liaMessages) {
    const messages = messagesByConversation.get(message.conversation_id) || []
    messages.push(message)
    messagesByConversation.set(message.conversation_id, messages)
  }

  const legacyHighlights = input.liaConversations.map((conversation) => {
    const messages = messagesByConversation.get(conversation.conversation_id) || []
    return [
      `Interaccion SofLIA: ${conversation.conversation_title || activityTitleById.get(conversation.activity_id || '') || 'Actividad con SofLIA'}.`,
      `Fragmentos clave:\n${formatMessages(messages)}`,
    ].join('\n')
  })

  return [...structuredHighlights, ...legacyHighlights].filter(Boolean).slice(0, 8)
}

function buildQuizReviews(input: {
  activities: ActivityRow[]
  materials: MaterialRow[]
  quizStatus: RequiredQuizStatus
}): string[] {
  return input.quizStatus.quizzes.flatMap((quiz) => {
    const rawContent =
      quiz.type === 'material'
        ? input.materials.find((material) => material.material_id === quiz.id)
            ?.content_data
        : input.activities.find((activity) => activity.activity_id === quiz.id)
            ?.activity_content

    return getQuizReviewLines({ quiz, rawContent })
  })
}

export function buildLessonAutoNotePromptInputFromRows(input: {
  activities: ActivityRow[]
  courseTitle: string
  dialogueResults: DialogueResultRow[]
  dialogueSessions: DialogueSessionRow[]
  dialogueTurns: DialogueTurnRow[]
  evaluations: ActivityEvaluationRow[]
  lesson: LessonRow
  liaConversations: LiaConversationRow[]
  liaMessages: LiaMessageRow[]
  materials: MaterialRow[]
  quizStatus: RequiredQuizStatus
  submissions: ActivitySubmissionRow[]
}): LessonAutoNotePromptInput {
  return {
    activityNotes: buildActivityNotes({
      activities: input.activities,
      evaluations: input.evaluations,
      materials: input.materials,
      submissions: input.submissions,
    }),
    courseTitle: input.courseTitle,
    dialogueHighlights: buildDialogueHighlights({
      activities: input.activities,
      dialogueResults: input.dialogueResults,
      dialogueSessions: input.dialogueSessions,
      dialogueTurns: input.dialogueTurns,
      liaConversations: input.liaConversations,
      liaMessages: input.liaMessages,
    }),
    lessonDescription: input.lesson.lesson_description,
    lessonSummary: input.lesson.summary_content,
    lessonTitle: input.lesson.lesson_title,
    quizReviews: buildQuizReviews({
      activities: input.activities,
      materials: input.materials,
      quizStatus: input.quizStatus,
    }),
    transcript: input.lesson.transcript_content,
  }
}

interface LessonAutoNotePromptData {
  promptInput: LessonAutoNotePromptInput
  transcriptRows: DialogueTranscriptRows
}

async function buildPromptInput(
  input: GenerateLessonAutoNoteInput,
): Promise<LessonAutoNotePromptData> {
  let liaConversationsQuery = fromFlexible(input.supabase, 'lia_conversations')
    .select('conversation_id, activity_id, conversation_title, total_user_messages, updated_at')
    .eq('user_id', input.userId)
    .eq('lesson_id', input.lessonId)
    .eq('enrollment_id', input.enrollmentId)

  if (input.organizationId) {
    liaConversationsQuery = liaConversationsQuery.eq(
      'organization_id',
      input.organizationId,
    )
  }

  liaConversationsQuery = liaConversationsQuery
    .order('updated_at', { ascending: true })
    .limit(50)

  const [
    lesson,
    activitiesResult,
    materialsResult,
    submissionsResult,
    dialogueSessionsResult,
    liaConversationsResult,
  ] = await Promise.all([
    loadLessonRow(input.supabase, input.lessonId),
    input.supabase
      .from('lesson_activities')
      .select('activity_id, activity_title, activity_description, activity_type, activity_content, ai_prompts, activity_order_index, activity_config, is_required')
      .eq('lesson_id', input.lessonId)
      .order('activity_order_index', { ascending: true })
      .returns<ActivityRow[]>(),
    input.supabase
      .from('lesson_materials')
      .select('material_id, material_title, material_description, material_type, content_data, material_order_index')
      .eq('lesson_id', input.lessonId)
      .order('material_order_index', { ascending: true })
      .returns<MaterialRow[]>(),
    input.supabase
      .from('user_activity_submissions')
      .select('submission_id, activity_id, status, response_text, response_payload, evidence_payload, submitted_at, updated_at')
      .eq('user_id', input.userId)
      .eq('lesson_id', input.lessonId)
      .eq('enrollment_id', input.enrollmentId)
      .returns<ActivitySubmissionRow[]>(),
    fromFlexible(input.supabase, 'soflia_dialogue_sessions')
      .select('session_id, activity_id, state, current_score, criteria_met, criteria_missing, completed_at, updated_at')
      .eq('user_id', input.userId)
      .eq('lesson_id', input.lessonId)
      .eq('enrollment_id', input.enrollmentId)
      .in('state', ['COMPLETE', 'SESSION_SUMMARY'])
      .order('updated_at', { ascending: true })
      .limit(50)
      .returns<DialogueSessionRow[]>(),
    liaConversationsQuery.returns<LiaConversationRow[]>(),
  ])

  const activities = activitiesResult.data || []
  const materials = materialsResult.data || []
  const submissions = submissionsResult.data || []
  const dialogueSessions = dialogueSessionsResult.data || []
  const liaConversations = liaConversationsResult.data || []

  const [
    evaluations,
    dialogueTurns,
    dialogueResults,
    liaMessages,
  ] = await Promise.all([
    loadActivityEvaluations(
      input.supabase,
      submissions.map((submission) => submission.submission_id),
    ),
    loadDialogueTurns(
      input.supabase,
      dialogueSessions.map((session) => session.session_id),
    ),
    loadDialogueResults(
      input.supabase,
      dialogueSessions.map((session) => session.session_id),
    ),
    loadLiaMessages(
      input.supabase,
      liaConversations.map((conversation) => conversation.conversation_id),
    ),
  ])

  const promptInput = buildLessonAutoNotePromptInputFromRows({
    activities,
    courseTitle: input.courseTitle,
    dialogueResults,
    dialogueSessions,
    dialogueTurns,
    evaluations,
    lesson,
    liaConversations,
    liaMessages,
    materials,
    quizStatus: input.quizStatus,
    submissions,
  })

  return {
    promptInput,
    transcriptRows: {
      activities,
      dialogueSessions,
      dialogueTurns,
      liaConversations,
      liaMessages,
    },
  }
}

/**
 * Appends the verbatim dialogue transcript after the AI summary, budgeted so
 * the final note never exceeds MAX_NOTE_CONTENT (the transcript builder trims
 * at whole-turn boundaries; the final sanitize is defensive re-validation).
 */
function composeNoteContent(
  aiHtml: string,
  transcriptRows: DialogueTranscriptRows,
): string {
  const transcriptBudget =
    MAX_NOTE_CONTENT - aiHtml.length - TRANSCRIPT_SECTION_RESERVE
  const transcript = buildDialogueTranscriptHtml(transcriptRows, transcriptBudget)

  if (!transcript.html) {
    return sanitizeHtml(
      `${aiHtml}${TRANSCRIPT_SECTION_HEADING}<p><em>No hubo conversación con SofLIA registrada en esta lección.</em></p>`,
      { level: 'rich', maxLength: MAX_NOTE_CONTENT },
    ).trim()
  }

  return sanitizeHtml(
    `${aiHtml}${TRANSCRIPT_SECTION_HEADING}${transcript.html}`,
    { level: 'rich', maxLength: MAX_NOTE_CONTENT },
  ).trim()
}

export async function generateLessonAutoNote(
  input: GenerateLessonAutoNoteInput,
): Promise<LessonAutoNoteResult> {
  try {
    if (input.quizStatus.hasRequiredQuizzes && !input.quizStatus.allQuizzesPassed) {
      return { reason: 'REQUIRED_QUIZZES_NOT_PASSED', status: 'skipped' }
    }

    const existing = await findExistingAutoNote(input.supabase, input)
    const decision = resolveLessonAutoNotePersistenceDecision({
      allowUpdate: input.allowUpdate,
      existingNoteId: existing?.note_id,
      existingUserEdited: existing?.is_user_edited,
    })

    // Corta antes de gastar tokens si el usuario ya editó el apunte.
    if (decision.action === 'skip') {
      return {
        noteId: decision.noteId,
        reason: existing?.is_user_edited
          ? 'AUTO_NOTE_USER_EDITED'
          : 'AUTO_NOTE_ALREADY_CURRENT',
        status: 'skipped',
      }
    }

    const { promptInput, transcriptRows } = await buildPromptInput(input)
    const prompt = buildLessonAutoNotePrompt(promptInput)
    let quality: 'ai' | 'deterministic' = 'ai'
    let warning: string | undefined
    let aiHtml: string

    try {
      aiHtml = await generateNoteHtml({
        generation: input,
        prompt,
        untrustedText: [
          ...promptInput.activityNotes,
          ...promptInput.dialogueHighlights,
          ...promptInput.quizReviews,
        ].join('\n'),
      })
    } catch (generationError) {
      quality = 'deterministic'
      warning =
        generationError instanceof Error
          ? generationError.message
          : 'AI generation unavailable'
      logger.warn('Using deterministic lesson note fallback', {
        lessonId: input.lessonId,
        reason: warning,
        userId: input.userId,
      })
      aiHtml = buildDeterministicLessonAutoNoteHtml(promptInput)
    }

    const noteContent = composeNoteContent(aiHtml, transcriptRows)
    const noteTitle = clip(`Apunte SofLIA: ${promptInput.lessonTitle}`, 240)

    const persisted = await persistLessonAutoNote({
      allowUpdate: input.allowUpdate,
      content: noteContent,
      enrollmentId: input.enrollmentId,
      lessonId: input.lessonId,
      noteTitle,
      organizationId: input.organizationId,
      supabase: input.supabase,
      userId: input.userId,
    })

    return { ...persisted, quality, warning }
  } catch (error) {
    logger.error('Lesson auto-note generation failed', {
      error: error instanceof Error ? error.message : error,
      lessonId: input.lessonId,
      userId: input.userId,
    })

    return {
      error: error instanceof Error ? error.message : 'Error desconocido',
      status: 'failed',
    }
  }
}
