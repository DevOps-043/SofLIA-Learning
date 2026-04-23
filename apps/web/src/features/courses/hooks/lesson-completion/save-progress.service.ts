import { getUnknownErrorMessage, isAbortLikeError } from "./error.utils";

export async function saveLessonProgress(
  slug: string,
  lessonId: string,
  organizationId: string | null,
  signal?: AbortSignal
): Promise<Response> {
  return fetch(`/api/courses/${slug}/lessons/${lessonId}/progress`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(organizationId ? { organizationId } : {}),
    signal,
  }).catch((fetchError: unknown) => {
    if (isAbortLikeError(fetchError, signal)) {
      return new Response(null, { status: 200, statusText: "Cancelled" });
    }

    if (process.env.NODE_ENV === "development") {
      console.warn(
        "Error de red guardando progreso (ignorado):",
        getUnknownErrorMessage(fetchError)
      );
    }

    return new Response(null, {
      status: 200,
      statusText: "Network Error (ignored)",
    });
  });
}
