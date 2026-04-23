import { normalizeNoteFormData } from "../../components/learn/notes/utils";
import { fetchWithTimeout, readResponseError } from "./api";
import { NOTE_DELETE_TIMEOUT_MS, type SaveNoteRequest } from "./types";

type SaveNoteResult =
  | { ok: true; data: unknown }
  | { ok: false; error: string };

export async function saveNoteRequest({
  slug,
  lessonId,
  noteId,
  noteData,
}: SaveNoteRequest): Promise<SaveNoteResult> {
  const response = await fetch(buildNoteUrl(slug, lessonId, noteId), {
    method: noteId ? "PUT" : "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(normalizeNoteFormData(noteData)),
  });

  if (!response.ok) {
    return { ok: false, error: await readResponseError(response, "Error desconocido") };
  }

  return { ok: true, data: await response.json() };
}

export function deleteNoteRequest(
  slug: string,
  lessonId: string,
  noteId: string
): Promise<Response> {
  return fetchWithTimeout(
    buildNoteUrl(slug, lessonId, noteId),
    { method: "DELETE", credentials: "include" },
    NOTE_DELETE_TIMEOUT_MS
  );
}

function buildNoteUrl(slug: string, lessonId: string, noteId?: string) {
  const baseUrl = `/api/courses/${slug}/lessons/${lessonId}/notes`;
  return noteId ? `${baseUrl}/${noteId}` : baseUrl;
}
