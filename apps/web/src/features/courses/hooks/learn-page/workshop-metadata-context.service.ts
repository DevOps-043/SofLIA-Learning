import type { CourseLessonContext } from '../../../../core/types/lia.types'

interface WorkshopMetadataLessonPayload {
  lessonId: string
  lessonTitle: string
  lessonDescription?: string
  lessonOrderIndex: number
  durationSeconds?: number
}

interface WorkshopMetadataModulePayload {
  moduleId: string
  moduleTitle: string
  moduleDescription?: string
  moduleOrderIndex: number
  lessons: WorkshopMetadataLessonPayload[]
}

export interface WorkshopMetadataPayload {
  workshopId: string
  workshopTitle: string
  workshopDescription?: string
  modules: WorkshopMetadataModulePayload[]
}

export function buildWorkshopMetadataContext(params: {
  metadata: WorkshopMetadataPayload
  slug: string
  userJobTitle?: string
}): CourseLessonContext {
  const { metadata, slug, userJobTitle } = params

  return {
    contextType: 'workshop',
    courseId: metadata.workshopId,
    courseSlug: slug,
    courseTitle: metadata.workshopTitle,
    courseDescription: metadata.workshopDescription,
    allModules: metadata.modules.map((module) => ({
      moduleId: module.moduleId,
      moduleTitle: module.moduleTitle,
      moduleDescription: module.moduleDescription,
      moduleOrderIndex: module.moduleOrderIndex,
      lessons: module.lessons.map((lesson) => ({
        lessonId: lesson.lessonId,
        lessonTitle: lesson.lessonTitle,
        lessonDescription: lesson.lessonDescription,
        lessonOrderIndex: lesson.lessonOrderIndex,
        durationSeconds: lesson.durationSeconds,
      })),
    })),
    userRole: userJobTitle,
  }
}
