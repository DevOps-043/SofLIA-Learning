import 'server-only'

import { createAdminClient } from '@/lib/supabase/admin'

type AdminClient = ReturnType<typeof createAdminClient>

export class ChatNoteProvenanceError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ChatNoteProvenanceError'
  }
}

interface LooseQueryResult<T> {
  data: T | null
  error: { message: string } | null
}

interface LooseBuilder {
  eq(column: string, value: unknown): LooseBuilder
  maybeSingle<T>(): PromiseLike<LooseQueryResult<T>>
  select(columns?: string): LooseBuilder
  upsert(
    values: unknown,
    options?: { onConflict?: string },
  ): LooseBuilder
}

interface ConversationRow {
  conversation_id: string
  course_id: string | null
  enrollment_id: string | null
  lesson_id: string | null
  organization_id: string | null
  user_id: string
}

interface MessageRow {
  content: string
  conversation_id: string
  is_system_message: boolean | null
  message_id: string
  message_sequence: number
  role: string
}

export interface ChatNoteProvenanceInput {
  conversation_id: string
  user_message_id?: string
  assistant_message_id?: string
}

export interface ResolvedChatNoteProvenance {
  assistantMessageId: string
  canonicalContentHtml: string
  conversationId: string
  userMessageId: string
}

function looseFrom(client: AdminClient, table: string): LooseBuilder {
  return (client as unknown as { from(name: string): LooseBuilder }).from(table)
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function toParagraphs(value: string): string {
  return value
    .trim()
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, '<br>')}</p>`)
    .join('')
}

function buildCanonicalConversationHtml(
  userMessage: MessageRow,
  assistantMessage: MessageRow,
): string {
  return [
    '<section data-note-section="soflia-conversation">',
    '<h2>Conversaci&oacute;n con SofLIA</h2>',
    '<h3>Tu pregunta</h3>',
    toParagraphs(userMessage.content),
    '<h3>Respuesta de SofLIA</h3>',
    toParagraphs(assistantMessage.content),
    '</section>',
  ].join('')
}

/** Prevents pairing a valid course slug with a lesson from another course. */
export async function assertNoteLessonScope(params: {
  client?: AdminClient
  courseId: string
  lessonId: string
}): Promise<void> {
  const client = params.client ?? createAdminClient()
  const { data, error } = await client
    .from('course_lessons')
    .select('lesson_id, course_modules!inner(course_id)')
    .eq('lesson_id', params.lessonId)
    .maybeSingle()

  if (error) {
    throw new Error(`Error al validar la lección: ${error.message}`)
  }

  const courseId = (
    data as unknown as { course_modules: { course_id: string } | null } | null
  )?.course_modules?.course_id
  if (!data || courseId !== params.courseId) {
    throw new ChatNoteProvenanceError(
      'La lección no pertenece al curso indicado.',
    )
  }
}

async function loadMessage(params: {
  client: AdminClient
  conversationId: string
  messageId?: string
  role: 'user' | 'assistant'
  beforeSequence?: number
}): Promise<MessageRow | null> {
  let query = params.client
    .from('lia_messages')
    .select(
      'message_id, conversation_id, role, content, message_sequence, is_system_message',
    )
    .eq('conversation_id', params.conversationId)
    .eq('role', params.role)

  if (params.messageId) {
    query = query.eq('message_id', params.messageId)
  }
  if (params.beforeSequence !== undefined) {
    query = query.lt('message_sequence', params.beforeSequence)
  }

  const { data, error } = await query
    .order('message_sequence', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    throw new Error(`Error al validar mensajes de SofLIA: ${error.message}`)
  }

  return (data as MessageRow | null) ?? null
}

/**
 * Resolves a client-provided chat reference against the authoritative history.
 * If exact message ids are not available yet, it selects the latest visible
 * assistant turn and its immediately preceding user turn.
 */
export async function resolveChatNoteProvenance(params: {
  client?: AdminClient
  courseId: string
  enrollmentId: string
  input: ChatNoteProvenanceInput
  lessonId: string
  organizationId: string
  userId: string
}): Promise<ResolvedChatNoteProvenance> {
  const client = params.client ?? createAdminClient()

  const { data: conversation, error: conversationError } = await looseFrom(
    client,
    'lia_conversations',
  )
    .select(
      'conversation_id, user_id, organization_id, enrollment_id, course_id, lesson_id',
    )
    .eq('conversation_id', params.input.conversation_id)
    .eq('user_id', params.userId)
    .eq('organization_id', params.organizationId)
    .eq('enrollment_id', params.enrollmentId)
    .eq('course_id', params.courseId)
    .eq('lesson_id', params.lessonId)
    .maybeSingle<ConversationRow>()

  if (conversationError) {
    throw new Error(
      `Error al validar la conversación de SofLIA: ${conversationError.message}`,
    )
  }
  if (!conversation) {
    throw new ChatNoteProvenanceError(
      'La conversación de SofLIA no pertenece a esta lección.',
    )
  }

  const assistantMessage = await loadMessage({
    client,
    conversationId: conversation.conversation_id,
    messageId: params.input.assistant_message_id,
    role: 'assistant',
  })

  if (!assistantMessage || assistantMessage.is_system_message === true) {
    throw new ChatNoteProvenanceError(
      'No se encontró una respuesta visible de SofLIA.',
    )
  }

  const userMessage = await loadMessage({
    beforeSequence: assistantMessage.message_sequence,
    client,
    conversationId: conversation.conversation_id,
    messageId: params.input.user_message_id,
    role: 'user',
  })

  if (!userMessage || userMessage.is_system_message === true) {
    throw new ChatNoteProvenanceError(
      'No se encontró la pregunta asociada a la respuesta.',
    )
  }

  return {
    assistantMessageId: assistantMessage.message_id,
    canonicalContentHtml: buildCanonicalConversationHtml(
      userMessage,
      assistantMessage,
    ),
    conversationId: conversation.conversation_id,
    userMessageId: userMessage.message_id,
  }
}

/** Persists auditable chat provenance after the note row has been created. */
export async function persistChatNoteProvenance(params: {
  client?: AdminClient
  noteId: string
  organizationId: string
  provenance: ResolvedChatNoteProvenance
  userId: string
}): Promise<void> {
  const client = params.client ?? createAdminClient()
  const { error } = await looseFrom(client, 'notebook_note_metadata')
    .upsert(
      {
        knowledge_type: 'qa',
        lia_assistant_message_id: params.provenance.assistantMessageId,
        lia_conversation_id: params.provenance.conversationId,
        lia_user_message_id: params.provenance.userMessageId,
        lifecycle_status: 'draft',
        note_id: params.noteId,
        organization_id: params.organizationId,
        user_id: params.userId,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'note_id' },
    )
    .select('note_id')
    .maybeSingle<{ note_id: string }>()

  if (error) {
    throw new Error(`Error al guardar la procedencia de SofLIA: ${error.message}`)
  }
}
