import { ContentTranslationService } from '../../../../../../core/services/contentTranslation.service';
import { toActivityArray, toMaterialArray } from './activity-content-normalizers';
import type { LessonContentSnapshot } from './types';

type TranslationLanguage = Parameters<typeof ContentTranslationService.translateArray>[3];

interface FetchLessonContentParams {
  lessonId: string;
  organizationId?: string | null;
  selectedLang: string;
  slug: string;
}

function buildQuizStatusUrl(slug: string, lessonId: string, organizationId?: string | null): string {
  const baseUrl = `/api/courses/${slug}/lessons/${lessonId}/quiz/status`;
  return organizationId ? `${baseUrl}?orgId=${encodeURIComponent(organizationId)}` : baseUrl;
}

async function getTranslatedActivities(response: Response, selectedLang: string): Promise<unknown> {
  const activitiesData = await response.json();

  if (selectedLang === 'es' || !Array.isArray(activitiesData) || activitiesData.length === 0) {
    return activitiesData;
  }

  return ContentTranslationService.translateArray(
    'activity',
    activitiesData.map((activity) => ({
      ...(activity as Record<string, unknown>),
      id: (activity as { activity_id?: string }).activity_id,
    })),
    ['activity_title', 'activity_description', 'activity_content'],
    selectedLang as TranslationLanguage
  );
}

export async function fetchLessonContent({
  lessonId,
  organizationId,
  selectedLang,
  slug,
}: FetchLessonContentParams): Promise<LessonContentSnapshot> {
  const [activitiesResponse, materialsResponse, quizStatusResponse] = await Promise.all([
    fetch(`/api/courses/${slug}/lessons/${lessonId}/activities`, { credentials: 'include', cache: 'no-store' }),
    fetch(`/api/courses/${slug}/lessons/${lessonId}/materials`, { credentials: 'include', cache: 'no-store' }),
    fetch(buildQuizStatusUrl(slug, lessonId, organizationId), { credentials: 'include', cache: 'no-store' }),
  ]);

  return {
    activities: activitiesResponse.ok
      ? toActivityArray(await getTranslatedActivities(activitiesResponse, selectedLang))
      : [],
    materials: materialsResponse.ok ? toMaterialArray(await materialsResponse.json()) : [],
    quizStatus: quizStatusResponse.ok ? await quizStatusResponse.json() : null,
  };
}
