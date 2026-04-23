import type { LearnTranslationContext } from "../../components/learn/types";
import { mapActivities, mapMaterials } from "./lesson-sidebar.mappers";

export function buildLessonSidebarDataUrl(
  slug: string,
  lessonId: string,
  language: "es" | "en" | "pt",
  organizationId: string | null
) {
  const queryParams = new URLSearchParams();
  queryParams.set("language", language);
  if (organizationId) queryParams.set("orgId", organizationId);

  return `/api/courses/${slug}/lessons/${lessonId}/sidebar-data?${queryParams.toString()}`;
}

export function buildLessonSidebarPayload(data: any) {
  return {
    activities: mapActivities(data.activities),
    materials: mapMaterials(data.materials),
    quizStatus: data.quizStatus ?? null,
    translationContext: (data.translationContext as LearnTranslationContext) ?? null,
  };
}
