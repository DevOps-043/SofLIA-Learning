import type {
  CourseTimeEstimationTarget,
  TimeEstimationTargetType,
} from '@/features/admin/services/courseTimeEstimation.types'
import { normalizeActivityConfig } from '@/features/courses/types/activity-config'
import type {
  CourseLessonInfo,
  LessonActivityInfo,
  LessonMaterialInfo,
} from './estimation.types'

const SUPPORTED_MATERIAL_TYPES = new Set<TimeEstimationTargetType>([
  'pdf',
  'link',
  'document',
  'quiz',
  'exercise',
  'reading',
])

const SUPPORTED_ACTIVITY_TYPES = new Set<TimeEstimationTargetType>([
  'quiz',
  'exercise',
  'reflection',
  'discussion',
  'ai_chat',
])

export function toMaterialTarget(
  material: LessonMaterialInfo,
  lesson: CourseLessonInfo,
  moduleTitle: string | null,
): CourseTimeEstimationTarget | null {
  if (!SUPPORTED_MATERIAL_TYPES.has(material.material_type as TimeEstimationTargetType)) return null

  return {
    id: material.material_id,
    kind: 'material',
    targetType: material.material_type as TimeEstimationTargetType,
    lessonId: material.lesson_id,
    lessonTitle: lesson.lesson_title || 'Leccion sin titulo',
    moduleId: lesson.module_id,
    moduleTitle,
    title: material.material_title,
    description: material.material_description,
    content: material.content_data,
    externalUrl: material.external_url,
    fileUrl: material.file_url,
    estimatedTimeMinutes: material.estimated_time_minutes,
  }
}

export function toActivityTarget(
  activity: LessonActivityInfo,
  lesson: CourseLessonInfo,
  moduleTitle: string | null,
): CourseTimeEstimationTarget | null {
  if (!SUPPORTED_ACTIVITY_TYPES.has(activity.activity_type as TimeEstimationTargetType)) return null

  return {
    id: activity.activity_id,
    kind: 'activity',
    targetType: activity.activity_type as TimeEstimationTargetType,
    lessonId: activity.lesson_id,
    lessonTitle: lesson.lesson_title || 'Leccion sin titulo',
    moduleId: lesson.module_id,
    moduleTitle,
    title: activity.activity_title,
    description: activity.activity_description,
    content: activity.activity_content,
    activityConfig: normalizeActivityConfig(activity.activity_config),
    aiPrompts: activity.ai_prompts,
    requiresSofliaValidation: activity.requires_soflia_validation,
    estimatedTimeMinutes: activity.estimated_time_minutes,
  }
}
