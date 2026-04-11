import { NextRequest, NextResponse } from 'next/server'
import { CourseTimeEstimationService } from '@/features/admin/services/courseTimeEstimation.service'
import type {
  CourseTimeEstimationTarget,
  TimeEstimationTargetType,
} from '@/features/admin/services/courseTimeEstimation.types'
import { AdminLessonsService } from '@/features/admin/services/adminLessons.service'
import { normalizeActivityConfig } from '@/features/courses/types/activity-config'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { createClient } from '@/lib/supabase/server'

interface CourseModuleInfo {
  module_id: string
  module_title: string | null
}

interface CourseLessonInfo {
  lesson_id: string
  lesson_title: string | null
  module_id: string | null
}

interface LessonMaterialInfo {
  material_id: string
  lesson_id: string
  material_title: string
  material_description: string | null
  material_type: string
  content_data: unknown
  external_url: string | null
  file_url: string | null
  estimated_time_minutes: number | null
}

interface LessonActivityInfo {
  activity_id: string
  lesson_id: string
  activity_title: string
  activity_description: string | null
  activity_type: string
  activity_content: string
  activity_config: unknown
  ai_prompts: string | null
  requires_soflia_validation: boolean
  estimated_time_minutes: number | null
}

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

function toMaterialTarget(
  material: LessonMaterialInfo,
  lesson: CourseLessonInfo,
  moduleTitle: string | null,
): CourseTimeEstimationTarget | null {
  if (!SUPPORTED_MATERIAL_TYPES.has(material.material_type as TimeEstimationTargetType)) {
    return null
  }

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

function toActivityTarget(
  activity: LessonActivityInfo,
  lesson: CourseLessonInfo,
  moduleTitle: string | null,
): CourseTimeEstimationTarget | null {
  if (!SUPPORTED_ACTIVITY_TYPES.has(activity.activity_type as TimeEstimationTargetType)) {
    return null
  }

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

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) {
      return auth
    }

    const { id: courseId } = await params
    const supabase = await createClient()

    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('id, title')
      .eq('id', courseId)
      .single()

    if (courseError || !course) {
      return NextResponse.json(
        {
          success: false,
          error: 'Curso no encontrado',
        },
        { status: 404 },
      )
    }

    const { data: modules, error: modulesError } = await supabase
      .from('course_modules')
      .select('module_id, module_title')
      .eq('course_id', courseId)
      .order('module_order_index', { ascending: true })

    if (modulesError) {
      return NextResponse.json(
        {
          success: false,
          error: 'No se pudieron obtener los modulos del curso',
        },
        { status: 500 },
      )
    }

    const moduleRows = (modules || []) as CourseModuleInfo[]
    const moduleIds = moduleRows.map((module) => module.module_id)

    if (moduleIds.length === 0) {
      return NextResponse.json({
        success: true,
        updated: 0,
        message: 'El curso no tiene modulos para estimar.',
      })
    }

    const { data: lessons, error: lessonsError } = await supabase
      .from('course_lessons')
      .select('lesson_id, lesson_title, module_id')
      .in('module_id', moduleIds)
      .order('lesson_order_index', { ascending: true })

    if (lessonsError) {
      return NextResponse.json(
        {
          success: false,
          error: 'No se pudieron obtener las lecciones del curso',
        },
        { status: 500 },
      )
    }

    const lessonRows = (lessons || []) as CourseLessonInfo[]
    const lessonIds = lessonRows.map((lesson) => lesson.lesson_id)

    if (lessonIds.length === 0) {
      return NextResponse.json({
        success: true,
        updated: 0,
        message: 'El curso no tiene lecciones para estimar.',
      })
    }

    const [{ data: materials, error: materialsError }, { data: activities, error: activitiesError }] =
      await Promise.all([
        supabase
          .from('lesson_materials')
          .select(
            'material_id, lesson_id, material_title, material_description, material_type, content_data, external_url, file_url, estimated_time_minutes',
          )
          .in('lesson_id', lessonIds)
          .is('estimated_time_minutes', null),
        supabase
          .from('lesson_activities')
          .select(
            'activity_id, lesson_id, activity_title, activity_description, activity_type, activity_content, activity_config, ai_prompts, requires_soflia_validation, estimated_time_minutes',
          )
          .in('lesson_id', lessonIds)
          .is('estimated_time_minutes', null),
      ])

    if (materialsError || activitiesError) {
      return NextResponse.json(
        {
          success: false,
          error: 'No se pudieron obtener los materiales o actividades pendientes',
        },
        { status: 500 },
      )
    }

    const lessonById = new Map(
      lessonRows.map((lesson) => [lesson.lesson_id, lesson]),
    )
    const moduleTitleById = new Map(
      moduleRows.map((module) => [module.module_id, module.module_title || null]),
    )

    const targets: CourseTimeEstimationTarget[] = [
      ...((materials || []) as LessonMaterialInfo[])
        .map((material) => {
          const lesson = lessonById.get(material.lesson_id)
          if (!lesson) {
            return null
          }

          return toMaterialTarget(
            material,
            lesson,
            lesson.module_id ? moduleTitleById.get(lesson.module_id) || null : null,
          )
        })
        .filter((target): target is CourseTimeEstimationTarget => target !== null),
      ...((activities || []) as LessonActivityInfo[])
        .map((activity) => {
          const lesson = lessonById.get(activity.lesson_id)
          if (!lesson) {
            return null
          }

          return toActivityTarget(
            activity,
            lesson,
            lesson.module_id ? moduleTitleById.get(lesson.module_id) || null : null,
          )
        })
        .filter((target): target is CourseTimeEstimationTarget => target !== null),
    ]

    if (targets.length === 0) {
      return NextResponse.json({
        success: true,
        updated: 0,
        message: 'No hay tiempos faltantes para estimar en este curso.',
      })
    }

    const estimationResults = await CourseTimeEstimationService.estimateTargets(
      course.title,
      targets,
      auth.userId,
    )

    const resultById = new Map(
      estimationResults.map((result) => [result.targetId, result]),
    )
    const affectedLessonIds = new Set<string>()
    let updatedMaterials = 0
    let updatedActivities = 0

    const materialUpdates = ((materials || []) as LessonMaterialInfo[]).map(
      async (material) => {
        const result = resultById.get(material.material_id)
        if (!result) {
          return
        }

        const { error } = await supabase
          .from('lesson_materials')
          .update({ estimated_time_minutes: result.estimatedMinutes })
          .eq('material_id', material.material_id)

        if (error) {
          throw error
        }

        updatedMaterials += 1
        affectedLessonIds.add(material.lesson_id)
      },
    )

    const activityUpdates = ((activities || []) as LessonActivityInfo[]).map(
      async (activity) => {
        const result = resultById.get(activity.activity_id)
        if (!result) {
          return
        }

        const { error } = await supabase
          .from('lesson_activities')
          .update({ estimated_time_minutes: result.estimatedMinutes })
          .eq('activity_id', activity.activity_id)

        if (error) {
          throw error
        }

        updatedActivities += 1
        affectedLessonIds.add(activity.lesson_id)
      },
    )

    await Promise.all([...materialUpdates, ...activityUpdates])

    const recalculation = await AdminLessonsService.recalculateLessonDurations(
      Array.from(affectedLessonIds),
    )

    const geminiUpdatedCount = estimationResults.filter(
      (result) => result.source === 'gemini',
    ).length
    const fallbackCount = estimationResults.filter(
      (result) => result.source !== 'gemini',
    ).length

    return NextResponse.json({
      success: true,
      updated: updatedMaterials + updatedActivities,
      updatedMaterials,
      updatedActivities,
      recalculatedLessons: recalculation.updated,
      recalculationErrors: recalculation.errors,
      geminiUpdatedCount,
      fallbackCount,
      message:
        updatedMaterials + updatedActivities > 0
          ? `Se estimaron y guardaron ${updatedMaterials + updatedActivities} tiempos faltantes.`
          : 'No fue necesario actualizar tiempos faltantes.',
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Error desconocido al estimar tiempos faltantes',
      },
      { status: 500 },
    )
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) {
    return auth
  }

  const { id: courseId } = await params

  return NextResponse.json({
    success: true,
    courseId,
    endpoint: `/api/admin/courses/${courseId}/estimate-missing-times`,
    description:
      'Estima tiempos faltantes de materiales y actividades, los guarda y recalcula duraciones.',
  })
}
