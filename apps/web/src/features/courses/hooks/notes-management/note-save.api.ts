import type { LearnNoteFormData } from "../../components/learn/types";
import { normalizeNoteFormData } from "../../components/learn/notes/utils";
import { readResponseError } from "./api";

type NoteRequestResult =
  | { ok: true; data: unknown }
  | { ok: false; error: string };

export async function updateNoteRequest(
  slug: string,
  lessonId: string,
  noteId: string,
  noteData: LearnNoteFormData
): Promise<NoteRequestResult> {
  const response = await fetch(
    `/api/courses/${slug}/lessons/${lessonId}/notes/${noteId}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(normalizeNoteFormData(noteData)),
    }
  );

  if (!response.ok) {
    return { ok: false, error: await readResponseError(response, "Error desconocido") };
  }

  return { ok: true, data: await response.json() };
}

export async function createNoteRequest(
  slug: string,
  lessonId: string,
  noteData: LearnNoteFormData,
  organizationId?: string | null
): Promise<NoteRequestResult> {
  const response = await fetch(
    `/api/courses/${slug}/lessons/${lessonId}/notes`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...normalizeNoteFormData(noteData),
        organization_id: organizationId || null,
      }),
    }
  );

  if (!response.ok) {
    return { ok: false, error: await readResponseError(response, "Error desconocido") };
  }

  return { ok: true, data: await response.json() };
}
