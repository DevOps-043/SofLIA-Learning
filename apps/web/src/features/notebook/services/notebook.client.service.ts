/**
 * Notebook Client Service
 *
 * HTTP client for the notebook API endpoints.
 * All requests are org-scoped via the orgSlug path parameter.
 */

import type {
  NotebookMutationResponse,
  NotebookCoursesResponse,
  NotebookUpdateNoteInput,
  NotebookNotesQueryParams,
  NotebookNotesResponse,
} from '../types'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })

  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw new Error(body.error || `HTTP ${response.status}`)
  }

  return response.json()
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function getNotebookNotes(
  orgSlug: string,
  params?: NotebookNotesQueryParams,
): Promise<NotebookNotesResponse> {
  const searchParams = new URLSearchParams()

  if (params?.courseId) searchParams.set('courseId', params.courseId)
  if (params?.cursor) searchParams.set('cursor', params.cursor)
  if (params?.limit) searchParams.set('limit', String(params.limit))

  const queryString = searchParams.toString()
  const url = `/api/${orgSlug}/business-user/notebook/notes${queryString ? `?${queryString}` : ''}`

  return fetchJson<NotebookNotesResponse>(url)
}

export async function getNotebookCourses(
  orgSlug: string,
): Promise<NotebookCoursesResponse> {
  return fetchJson<NotebookCoursesResponse>(
    `/api/${orgSlug}/business-user/notebook/courses`,
  )
}

export async function updateNotebookNote(
  orgSlug: string,
  noteId: string,
  payload: NotebookUpdateNoteInput,
): Promise<NotebookMutationResponse> {
  return fetchJson<NotebookMutationResponse>(
    `/api/${orgSlug}/business-user/notebook/notes/${noteId}`,
    {
      method: 'PUT',
      body: JSON.stringify(payload),
    },
  )
}
