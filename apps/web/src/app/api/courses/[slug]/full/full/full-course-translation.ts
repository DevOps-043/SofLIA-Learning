import { ContentTranslationService } from '@/core/services/contentTranslation.service'
import type { CourseData, FullCourseRequest } from './full.types'

export async function translateCourseDetails(
  request: FullCourseRequest,
  courseData: CourseData,
): Promise<CourseData> {
  if (!courseData.id || request.language === 'es') {
    return courseData
  }

  const fieldsToTranslate = ['title']
  if (courseData.description) fieldsToTranslate.push('description')

  const translated = await ContentTranslationService.translateObject(
    'course',
    { ...courseData, id: courseData.id },
    fieldsToTranslate,
    request.language,
    request.supabase,
  )

  return {
    ...courseData,
    title: translated.title || courseData.title,
    description: translated.description || courseData.description,
  }
}
