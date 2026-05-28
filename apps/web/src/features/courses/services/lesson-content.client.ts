import { dedupedFetch } from '@/lib/supabase/request-deduplication'
import {
  normalizeLessonActivityRecord,
  normalizeLessonMaterialRecord,
} from '@/lib/course-content'
import type {
  LearnActivity,
  LearnActivitySummary,
  LearnMaterial,
  LearnMaterialSummary,
  LearnTranslationContext,
  LessonQuizStatus,
} from '../components/learn/types'

const LESSON_CONTENT_DEDUPE_TTL_MS = 5_000

export interface LessonContentSnapshot {
  activities: LearnActivity[]
  materials: LearnMaterial[]
  quizStatus: LessonQuizStatus | null
  translationContext?: LearnTranslationContext | null
}

interface LessonContentResponse {
  activities?: unknown
  materials?: unknown
  quizStatus?: unknown
  translationContext?: LearnTranslationContext | null
}

export interface FetchLessonContentParams {
  forceRefresh?: boolean
  lessonId: string
  organizationId?: string | null
  selectedLang: string
  slug: string
}

export const emptyLessonContentSnapshot: LessonContentSnapshot = {
  activities: [],
  materials: [],
  quizStatus: null,
  translationContext: null,
}

export function mapActivitiesForSidebar(
  activities: LearnActivity[],
): LearnActivitySummary[] {
  return activities.map((activity) => ({
    activity_id: activity.activity_id,
    activity_title: activity.activity_title,
    activity_description: activity.activity_description,
    activity_type: activity.activity_type,
    is_required: Boolean(activity.is_required),
    is_completed: Boolean(activity.is_completed),
  }))
}

export function mapMaterialsForSidebar(
  materials: LearnMaterial[],
): LearnMaterialSummary[] {
  return materials.map((material) => ({
    material_id: material.material_id,
    material_title: material.material_title,
    material_description: material.material_description,
    material_type: material.material_type,
    is_required:
      Boolean(material.is_required) || material.material_type === 'quiz',
  }))
}

export async function fetchLessonContentSnapshot({
  forceRefresh = false,
  lessonId,
  organizationId,
  selectedLang,
  slug,
}: FetchLessonContentParams): Promise<LessonContentSnapshot> {
  const url = buildLessonContentUrl({
    forceRefresh,
    lessonId,
    organizationId,
    selectedLang,
    slug,
  })
  const payload = await dedupedFetch<LessonContentResponse>(
    url,
    forceRefresh
      ? { credentials: 'include', cache: 'no-store' }
      : { credentials: 'include' },
    forceRefresh ? 0 : LESSON_CONTENT_DEDUPE_TTL_MS,
  )

  return {
    activities: toActivityArray(payload.activities),
    materials: toMaterialArray(payload.materials),
    quizStatus: isQuizStatus(payload.quizStatus) ? payload.quizStatus : null,
    translationContext: payload.translationContext ?? null,
  }
}

function buildLessonContentUrl({
  forceRefresh,
  lessonId,
  organizationId,
  selectedLang,
  slug,
}: FetchLessonContentParams): string {
  const queryParams = new URLSearchParams()
  queryParams.set('language', selectedLang || 'es')

  if (organizationId) {
    queryParams.set('orgId', organizationId)
  }

  if (forceRefresh) {
    queryParams.set('_r', String(Date.now()))
  }

  return `/api/courses/${slug}/lessons/${lessonId}/sidebar-data?${queryParams.toString()}`
}

function toActivityArray(payload: unknown): LearnActivity[] {
  if (!Array.isArray(payload)) {
    return []
  }

  return payload.map((activity) =>
    normalizeLessonActivityRecord(activity as LearnActivity),
  )
}

function toMaterialArray(payload: unknown): LearnMaterial[] {
  if (!Array.isArray(payload)) {
    return []
  }

  return payload.map((material) =>
    normalizeLessonMaterialRecord(material as LearnMaterial),
  )
}

function isQuizStatus(payload: unknown): payload is LessonQuizStatus {
  return Boolean(
    payload &&
      typeof payload === 'object' &&
      'hasRequiredQuizzes' in payload &&
      'totalRequiredQuizzes' in payload &&
      'quizzes' in payload,
  )
}
