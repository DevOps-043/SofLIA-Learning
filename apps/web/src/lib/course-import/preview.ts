import { normalizeImportedMaterialContent } from '../course-content'
import type {
  CourseEngineCourseData,
  CourseEngineModule,
  CourseEnginePayload,
  StagingCoursePreview,
} from './types'
import { buildPreviewActivity } from './preview-activity'
import { normalizeQuizData } from './quiz'
import { extractVideoInfo } from './video'

export function buildCoursePreviewFromPayload(staging: StagingCoursePreview) {
  const payload: Partial<CourseEnginePayload> = staging.payload ?? {}
  const courseData: Partial<CourseEngineCourseData> = payload.course ?? {}
  const modules: CourseEngineModule[] = payload.modules ?? []

  return {
    id: staging.id,
    approval_status: staging.status,
    is_update: staging.is_update,
    thumbnail_url: courseData.thumbnail_url ?? null,
    title: courseData.title ?? 'Sin título',
    description: courseData.description || courseData.title || '',
    level: courseData.level || 'beginner',
    category: courseData.category || 'General',
    duration_total_minutes: 0,
    instructor: staging.course?.instructor ?? {
      first_name: '',
      last_name: '',
      email: courseData.instructor_email ?? '',
      display_name: courseData.instructor_email ?? 'Instructor',
    },
    modules: modules.map((module, moduleIndex) => buildPreviewModule(module, moduleIndex)),
  }
}

function buildPreviewModule(module: CourseEngineModule, moduleIndex: number) {
  return {
    module_id: `staging-mod-${moduleIndex}`,
    module_title: module.title,
    module_order_index: module.order_index,
    is_published: false,
    lessons: (module.lessons ?? []).map((lesson, lessonIndex) => {
      const lessonId = `staging-les-${moduleIndex}-${lessonIndex}`
      const videoInfo = extractVideoInfo(lesson.video_url ?? '')
      return {
        lesson_id: lessonId,
        lesson_title: lesson.title,
        lesson_order_index: lesson.order_index,
        duration_seconds: lesson.duration || 60,
        video_provider: videoInfo.provider,
        video_provider_id: videoInfo.id || null,
        transcript_content: lesson.transcription ?? null,
        summary_content: lesson.summary ?? null,
        materials: (lesson.materials ?? []).map((material, materialIndex) => ({
          material_id: `staging-mat-${moduleIndex}-${lessonIndex}-${materialIndex}`,
          material_title: material.title,
          material_type: material.type === 'download' ? 'document' : material.type,
          external_url: material.url ?? null,
          file_url: material.type === 'download' ? material.url : null,
          content_data: material.type === 'quiz'
            ? normalizeQuizData(material.data)
            : normalizeImportedMaterialContent(material.data),
        })),
        activities: (lesson.activities ?? []).map((activity, activityIndex) =>
          buildPreviewActivity(activity, activityIndex, lessonId, moduleIndex, lessonIndex),
        ),
      }
    }),
  }
}
