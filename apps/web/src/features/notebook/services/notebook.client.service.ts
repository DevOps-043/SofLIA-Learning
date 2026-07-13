/**
 * Notebook — Client Service
 *
 * Thin fetch wrappers around the org-scoped Notebook API routes. All requests
 * use `credentials: 'include'` so the Supabase session cookie is sent; the
 * server resolves the org from the slug and enforces isolation.
 */

import type {
  CreateNotebookNoteInput,
  NotebookCourseOption,
  NotebookCourseOptionsResponse,
  NotebookDerivedTask,
  NotebookDerivedTaskListItem,
  NotebookDerivedTaskListResponse,
  NotebookDerivedTaskResponse,
  NotebookDerivedTaskStatus,
  NotebookEnrichmentReviewInput,
  NotebookGenerationMutationResponse,
  NotebookGenerationResponse,
  NotebookNoteDetail,
  NotebookNoteListResponse,
  NotebookNoteEnrichmentResponse,
  NotebookNoteEnrichmentState,
  NotebookNoteResponse,
  NotebookTree,
  NotebookTreeResponse,
  UpdateNotebookNoteInput,
} from '../types'

function base(orgSlug: string): string {
  return `/api/${encodeURIComponent(orgSlug)}/business-user/notebook`
}

async function parseError(response: Response, fallback: string): Promise<never> {
  let message = fallback
  try {
    const body = (await response.json()) as { error?: string }
    if (body?.error) message = body.error
  } catch {
    // ignore non-JSON bodies
  }
  throw new Error(message)
}

export async function fetchNotebookTree(orgSlug: string): Promise<NotebookTree> {
  const response = await fetch(`${base(orgSlug)}/tree`, {
    credentials: 'include',
    cache: 'no-store',
  })
  if (!response.ok) {
    return parseError(response, 'No se pudo cargar el libro de apuntes.')
  }
  const data = (await response.json()) as NotebookTreeResponse
  return data.tree
}

export async function fetchNotebookCourseOptions(
  orgSlug: string,
): Promise<NotebookCourseOption[]> {
  const response = await fetch(`${base(orgSlug)}/courses`, {
    credentials: 'include',
    cache: 'no-store',
  })
  if (!response.ok) {
    return parseError(response, 'No se pudieron cargar los cursos.')
  }
  const data = (await response.json()) as NotebookCourseOptionsResponse
  return data.courses
}

export async function fetchNotebookNote(
  orgSlug: string,
  noteId: string,
): Promise<NotebookNoteDetail> {
  const response = await fetch(`${base(orgSlug)}/notes/${noteId}`, {
    credentials: 'include',
    cache: 'no-store',
  })
  if (!response.ok) {
    return parseError(response, 'No se pudo cargar la nota.')
  }
  const data = (await response.json()) as NotebookNoteResponse
  return data.note
}

export async function fetchNotebookNotes(
  orgSlug: string,
  params: {
    query?: string
    source?: string
    courseId?: string
    lessonId?: string
    knowledgeType?: string
    lifecycleStatus?: string
    cursor?: string | null
    limit?: number
  } = {},
): Promise<NotebookNoteListResponse> {
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      query.set(key === 'query' ? 'q' : key, String(value))
    }
  }
  const response = await fetch(`${base(orgSlug)}/notes?${query.toString()}`, {
    credentials: 'include',
    cache: 'no-store',
  })
  if (!response.ok) {
    return parseError(response, 'No se pudieron cargar los apuntes.')
  }
  return (await response.json()) as NotebookNoteListResponse
}

export async function createNotebookNote(
  orgSlug: string,
  input: CreateNotebookNoteInput,
): Promise<NotebookNoteDetail> {
  const response = await fetch(`${base(orgSlug)}/notes`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  if (!response.ok) {
    return parseError(response, 'No se pudo crear la nota.')
  }
  const data = (await response.json()) as NotebookNoteResponse
  return data.note
}

export async function updateNotebookNote(
  orgSlug: string,
  noteId: string,
  input: UpdateNotebookNoteInput,
): Promise<NotebookNoteDetail> {
  const response = await fetch(`${base(orgSlug)}/notes/${noteId}`, {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  if (!response.ok) {
    return parseError(response, 'No se pudo guardar la nota.')
  }
  const data = (await response.json()) as NotebookNoteResponse
  return data.note
}

export async function fetchNotebookGeneration(
  orgSlug: string,
  params: { courseId: string; lessonId?: string },
): Promise<NotebookGenerationResponse> {
  const query = new URLSearchParams({ courseId: params.courseId })
  if (params.lessonId) query.set('lessonId', params.lessonId)
  const response = await fetch(`${base(orgSlug)}/generation?${query.toString()}`, {
    credentials: 'include',
    cache: 'no-store',
  })
  if (!response.ok) {
    return parseError(response, 'No se pudo consultar la generación del cuaderno.')
  }
  return (await response.json()) as NotebookGenerationResponse
}

/** Enqueues a durable compendium job. A 202 response is a successful result. */
export async function requestCourseCompendium(
  orgSlug: string,
  courseId: string,
): Promise<NotebookGenerationMutationResponse> {
  const response = await fetch(
    `${base(orgSlug)}/compendium/${encodeURIComponent(courseId)}`,
    { method: 'POST', credentials: 'include' },
  )
  if (!response.ok) {
    return parseError(response, 'No se pudo iniciar el compendio.')
  }
  return (await response.json()) as NotebookGenerationMutationResponse
}

export async function fetchNotebookTasks(
  orgSlug: string,
  params: {
    status?: NotebookDerivedTaskStatus | 'all'
    courseId?: string
    cursor?: string | null
    limit?: number
  } = {},
): Promise<NotebookDerivedTaskListResponse> {
  const query = new URLSearchParams()
  if (params.status && params.status !== 'all') query.set('status', params.status)
  if (params.courseId) query.set('courseId', params.courseId)
  if (params.cursor) query.set('cursor', params.cursor)
  query.set('limit', String(params.limit ?? 40))

  const response = await fetch(`${base(orgSlug)}/tasks?${query.toString()}`, {
    credentials: 'include',
    cache: 'no-store',
  })
  if (!response.ok) {
    return parseError(response, 'No se pudieron cargar las tareas del cuaderno.')
  }
  const data = (await response.json()) as NotebookDerivedTaskListResponse
  return {
    tasks: (data.tasks ?? []) as NotebookDerivedTaskListItem[],
    nextCursor: data.nextCursor ?? null,
  }
}

export async function fetchNoteEnrichmentState(
  orgSlug: string,
  noteId: string,
): Promise<NotebookNoteEnrichmentState> {
  const response = await fetch(
    `${base(orgSlug)}/notes/${encodeURIComponent(noteId)}/enrichment`,
    { credentials: 'include', cache: 'no-store' },
  )
  if (!response.ok) {
    return parseError(response, 'No se pudo cargar el enriquecimiento del apunte.')
  }
  const data = (await response.json()) as NotebookNoteEnrichmentResponse
  return data.state
}

export async function reviewNotebookNoteEnrichment(
  orgSlug: string,
  noteId: string,
  input: NotebookEnrichmentReviewInput,
): Promise<NotebookNoteEnrichmentState> {
  const response = await fetch(
    `${base(orgSlug)}/notes/${encodeURIComponent(noteId)}/enrichment`,
    {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    },
  )
  if (!response.ok) {
    return parseError(response, 'No se pudo revisar el enriquecimiento.')
  }
  const data = (await response.json()) as NotebookNoteEnrichmentResponse
  return data.state
}

export async function retryNotebookNoteEnrichment(
  orgSlug: string,
  noteId: string,
): Promise<NotebookNoteEnrichmentState> {
  const response = await fetch(
    `${base(orgSlug)}/notes/${encodeURIComponent(noteId)}/enrichment`,
    { method: 'POST', credentials: 'include' },
  )
  if (!response.ok) {
    return parseError(response, 'No se pudo reintentar el enriquecimiento.')
  }
  const data = (await response.json()) as NotebookNoteEnrichmentResponse
  return data.state
}

export async function updateDerivedTask(
  orgSlug: string,
  taskId: string,
  status: Exclude<NotebookDerivedTaskStatus, 'suggested'>,
): Promise<NotebookDerivedTask> {
  const response = await fetch(
    `${base(orgSlug)}/tasks/${encodeURIComponent(taskId)}`,
    {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    },
  )
  if (!response.ok) {
    return parseError(response, 'No se pudo actualizar la tarea.')
  }
  const data = (await response.json()) as NotebookDerivedTaskResponse
  return data.task
}

export async function deleteNotebookNote(
  orgSlug: string,
  noteId: string,
): Promise<void> {
  const response = await fetch(`${base(orgSlug)}/notes/${noteId}`, {
    method: 'DELETE',
    credentials: 'include',
  })
  if (!response.ok) {
    await parseError(response, 'No se pudo eliminar la nota.')
  }
}

export interface NotebookAssistantTurn {
  role: 'user' | 'assistant'
  content: string
}

export interface NotebookAssistantReply {
  reply: string
  /** HTML completo revisado del apunte cuando SofLIA propone una edición. */
  proposedContent: string | null
}

/** Pregunta a SofLIA sobre el apunte actual (contexto = contenido de la nota). */
export async function askNotebookAssistant(
  orgSlug: string,
  noteId: string,
  message: string,
  history: NotebookAssistantTurn[],
): Promise<NotebookAssistantReply> {
  const response = await fetch(
    `${base(orgSlug)}/notes/${encodeURIComponent(noteId)}/assistant`,
    {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, history }),
    },
  )
  if (!response.ok) {
    return parseError(response, 'SofLIA no pudo responder en este momento.')
  }
  const data = (await response.json()) as Partial<NotebookAssistantReply>
  return {
    proposedContent:
      typeof data.proposedContent === 'string' ? data.proposedContent : null,
    reply: data.reply ?? '',
  }
}
