import type {
  EstimatedTimeRow,
  LessonEstimatedTimeRelation,
  LessonTimeEstimate,
  SupabaseServerClient,
} from './lesson-time.types'
import { getRelationRecord, sumEstimatedMinutes } from './lesson-time.helpers'

export async function calculateLessonsTimeRealtime(
  courseId: string,
  supabase: SupabaseServerClient,
  interactionTimeMinutes: number,
): Promise<LessonTimeEstimate[]> {
  const { data: modules } = await supabase
    .from('course_modules')
    .select('module_id')
    .eq('course_id', courseId)

  const moduleIds = (modules || [])
    .map((module) => module.module_id)
    .filter((moduleId): moduleId is string => typeof moduleId === 'string' && moduleId.length > 0)

  if (moduleIds.length === 0) return []

  const { data: lessons } = await supabase
    .from('course_lessons')
    .select(`
      lesson_id,
      lesson_title,
      duration_seconds,
      module_id,
      course_modules (
        module_id,
        module_title
      )
    `)
    .in('module_id', moduleIds)
    .order('lesson_order_index', { ascending: true })

  if (!lessons || lessons.length === 0) return []

  const lessonIds = lessons.map((lesson) => lesson.lesson_id)
  const [activitiesResult, materialsResult] = await Promise.all([
    supabase.from('lesson_activities').select('lesson_id, estimated_time_minutes').in('lesson_id', lessonIds),
    supabase.from('lesson_materials').select('lesson_id, estimated_time_minutes').in('lesson_id', lessonIds),
  ])

  const actsByGrp = groupEstimatedRows(activitiesResult.data || [])
  const matsByGrp = groupEstimatedRows(materialsResult.data || [])

  return lessons.map((lesson) => {
    const videoMinutes = Math.ceil((lesson.duration_seconds || 0) / 60)
    const activitiesMinutes = sumEstimatedMinutes(actsByGrp.get(lesson.lesson_id) || [])
    const materialsMinutes = sumEstimatedMinutes(matsByGrp.get(lesson.lesson_id) || [])
    const totalMinutes = videoMinutes + activitiesMinutes + materialsMinutes + interactionTimeMinutes

    return {
      lessonId: lesson.lesson_id,
      lessonTitle: lesson.lesson_title || 'Sin título',
      moduleId: lesson.module_id,
      moduleName: getRelationRecord(lesson.course_modules)?.module_title || null,
      videoMinutes,
      activitiesMinutes,
      materialsMinutes,
      interactionsMinutes: interactionTimeMinutes,
      totalMinutes,
    }
  })
}

function groupEstimatedRows(rows: LessonEstimatedTimeRelation[]): Map<string, EstimatedTimeRow[]> {
  const groupedRows = new Map<string, EstimatedTimeRow[]>()

  rows.forEach((row) => {
    const group = groupedRows.get(row.lesson_id) || []
    group.push({ estimated_time_minutes: row.estimated_time_minutes })
    groupedRows.set(row.lesson_id, group)
  })

  return groupedRows
}
