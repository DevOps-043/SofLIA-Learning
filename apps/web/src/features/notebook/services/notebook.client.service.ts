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
  NotebookDerivedTaskResponse,
  NotebookDerivedTaskStatus,
  NotebookNoteDetail,
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

export async function regenerateCourseCompendium(
  orgSlug: string,
  courseId: string,
): Promise<NotebookNoteDetail> {
  const response = await fetch(
    `${base(orgSlug)}/compendium/${encodeURIComponent(courseId)}`,
    {
      method: 'POST',
      credentials: 'include',
    },
  )
  if (!response.ok) {
    return parseError(response, 'No se pudo regenerar el compendio.')
  }
  const data = (await response.json()) as NotebookNoteResponse
  return data.note
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
