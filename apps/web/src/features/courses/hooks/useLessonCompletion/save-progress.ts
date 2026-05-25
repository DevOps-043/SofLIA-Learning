import { getUnknownErrorMessage } from "./parsers";
import { isAbortError, warnInDevelopment } from "./error-utils";

interface SaveLessonProgressParams {
  slug: string;
  lessonId: string;
  organizationId?: string | null;
  signal?: AbortSignal;
}

export async function saveLessonProgress({
  slug,
  lessonId,
  organizationId,
  signal,
}: SaveLessonProgressParams): Promise<Response> {
  return fetch(`/api/courses/${slug}/lessons/${lessonId}/progress`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(organizationId ? { organizationId } : {}),
    signal,
  }).catch((fetchError: unknown) => {
    if (isAbortError(fetchError, signal)) {
      return new Response(null, { status: 200, statusText: "Cancelled" });
    }

    warnInDevelopment(
      "Error de red guardando progreso (ignorado):",
      getUnknownErrorMessage(fetchError)
    );
    return new Response(null, {
      status: 200,
      statusText: "Network Error (ignored)",
    });
  });
}
