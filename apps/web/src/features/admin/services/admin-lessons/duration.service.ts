import { createClient } from '@/lib/supabase/server'

interface LessonDurationRow {
  lesson_id: string
  duration_seconds?: number | null
  module_id?: string | null
}

interface TimedRow {
  lesson_id: string
  estimated_time_minutes?: number | null
}

export async function updateModuleDuration(moduleId: string): Promise<void> {
  const supabase = await createClient()

  const { data: lessons } = await supabase
    .from('course_lessons')
    .select('lesson_id, duration_seconds')
    .eq('module_id', moduleId)

  const lessonRows = (lessons || []) as LessonDurationRow[]
  const lessonIds = lessonRows.map((lesson) => lesson.lesson_id)
  const videoMinutes = Math.round(
    lessonRows.reduce(
      (sum, lesson) => sum + (lesson.duration_seconds || 0),
      0,
    ) / 60,
  )

  let materialsMinutes = 0
  let activitiesMinutes = 0

  if (lessonIds.length > 0) {
    const [materialsResult, activitiesResult] = await Promise.all([
      supabase
        .from('lesson_materials')
        .select('estimated_time_minutes')
        .in('lesson_id', lessonIds),
      supabase
        .from('lesson_activities')
        .select('estimated_time_minutes')
        .in('lesson_id', lessonIds),
    ])

    materialsMinutes = ((materialsResult.data || []) as Array<{
      estimated_time_minutes?: number | null
    }>).reduce(
      (sum, row) => sum + (row.estimated_time_minutes || 0),
      0,
    )
    activitiesMinutes = ((activitiesResult.data || []) as Array<{
      estimated_time_minutes?: number | null
    }>).reduce(
      (sum, row) => sum + (row.estimated_time_minutes || 0),
      0,
    )
  }

  await supabase
    .from('course_modules')
    .update({
      module_duration_minutes: videoMinutes + materialsMinutes + activitiesMinutes,
      updated_at: new Date().toISOString(),
    })
    .eq('module_id', moduleId)

  const { data: module } = await supabase
    .from('course_modules')
    .select('course_id')
    .eq('module_id', moduleId)
    .single()

  if ((module as { course_id?: string | null } | null)?.course_id) {
    await updateCourseDuration((module as { course_id: string }).course_id)
  }
}

export async function updateCourseDuration(courseId: string): Promise<void> {
  const supabase = await createClient()
  const { data: modules } = await supabase
    .from('course_modules')
    .select('module_duration_minutes')
    .eq('course_id', courseId)

  const totalMinutes = ((modules || []) as Array<{
    module_duration_minutes?: number | null
  }>).reduce(
    (sum, module) => sum + (module.module_duration_minutes || 0),
    0,
  )

  await supabase
    .from('courses')
    .update({
      duration_total_minutes: totalMinutes,
      updated_at: new Date().toISOString(),
    })
    .eq('id', courseId)
}

export async function recalculateAllLessonDurations(): Promise<{
  updated: number
  errors: string[]
}> {
  const supabase = await createClient()
  const errors: string[] = []
  let updated = 0

  const { data: lessons, error: lessonsError } = await supabase
    .from('course_lessons')
    .select('lesson_id, duration_seconds, module_id')
    .order('lesson_id')

  if (lessonsError) {
    throw lessonsError
  }

  if (!lessons || lessons.length === 0) {
    return { updated: 0, errors: [] }
  }

  const lessonRows = lessons as LessonDurationRow[]
  const lessonIds = lessonRows.map((lesson) => lesson.lesson_id)
  const [allMaterialsResult, allActivitiesResult] = await Promise.all([
    supabase
      .from('lesson_materials')
      .select('lesson_id, estimated_time_minutes')
      .in('lesson_id', lessonIds),
    supabase
      .from('lesson_activities')
      .select('lesson_id, estimated_time_minutes')
      .in('lesson_id', lessonIds),
  ])

  const materialsByLesson = buildEstimatedMinutesMap(
    (allMaterialsResult.data || []) as TimedRow[],
  )
  const activitiesByLesson = buildEstimatedMinutesMap(
    (allActivitiesResult.data || []) as TimedRow[],
  )
  const moduleIds = new Set<string>()

  for (const lesson of lessonRows) {
    try {
      const totalDurationMinutes =
        Math.round((lesson.duration_seconds || 0) / 60) +
        (materialsByLesson.get(lesson.lesson_id) || 0) +
        (activitiesByLesson.get(lesson.lesson_id) || 0)

      const { error: updateError } = await supabase
        .from('course_lessons')
        .update({
          total_duration_minutes: totalDurationMinutes,
          updated_at: new Date().toISOString(),
        })
        .eq('lesson_id', lesson.lesson_id)

      if (updateError) {
        errors.push(`Lesson ${lesson.lesson_id}: ${updateError.message}`)
        continue
      }

      updated += 1

      if (lesson.module_id) {
        moduleIds.add(lesson.module_id)
      }
    } catch (error) {
      errors.push(
        `Lesson ${lesson.lesson_id}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      )
    }
  }

  const moduleResults = await Promise.allSettled(
    Array.from(moduleIds).map(async (moduleId) => {
      await updateModuleDuration(moduleId)
      return moduleId
    }),
  )

  for (const result of moduleResults) {
    if (result.status === 'rejected') {
      errors.push(
        `Module update failed: ${
          result.reason instanceof Error
            ? result.reason.message
            : String(result.reason)
        }`,
      )
    }
  }

  return { updated, errors }
}

export async function recalculateLessonDurations(lessonIds: string[]): Promise<{
  updated: number
  errors: string[]
}> {
  const uniqueLessonIds = [...new Set(lessonIds.filter(Boolean))]

  if (uniqueLessonIds.length === 0) {
    return { updated: 0, errors: [] }
  }

  const supabase = await createClient()
  const errors: string[] = []
  let updated = 0

  const { data: lessons, error: lessonsError } = await supabase
    .from('course_lessons')
    .select('lesson_id, duration_seconds, module_id')
    .in('lesson_id', uniqueLessonIds)
    .order('lesson_id')

  if (lessonsError) {
    throw lessonsError
  }

  if (!lessons || lessons.length === 0) {
    return { updated: 0, errors: [] }
  }

  const lessonRows = lessons as LessonDurationRow[]
  const scopedLessonIds = lessonRows.map((lesson) => lesson.lesson_id)
  const [allMaterialsResult, allActivitiesResult] = await Promise.all([
    supabase
      .from('lesson_materials')
      .select('lesson_id, estimated_time_minutes')
      .in('lesson_id', scopedLessonIds),
    supabase
      .from('lesson_activities')
      .select('lesson_id, estimated_time_minutes')
      .in('lesson_id', scopedLessonIds),
  ])

  const materialsByLesson = buildEstimatedMinutesMap(
    (allMaterialsResult.data || []) as TimedRow[],
  )
  const activitiesByLesson = buildEstimatedMinutesMap(
    (allActivitiesResult.data || []) as TimedRow[],
  )
  const moduleIds = new Set<string>()

  for (const lesson of lessonRows) {
    try {
      const totalDurationMinutes =
        Math.round((lesson.duration_seconds || 0) / 60) +
        (materialsByLesson.get(lesson.lesson_id) || 0) +
        (activitiesByLesson.get(lesson.lesson_id) || 0)

      const { error: updateError } = await supabase
        .from('course_lessons')
        .update({
          total_duration_minutes: totalDurationMinutes,
          updated_at: new Date().toISOString(),
        })
        .eq('lesson_id', lesson.lesson_id)

      if (updateError) {
        errors.push(`Lesson ${lesson.lesson_id}: ${updateError.message}`)
        continue
      }

      updated += 1

      if (lesson.module_id) {
        moduleIds.add(lesson.module_id)
      }
    } catch (error) {
      errors.push(
        `Lesson ${lesson.lesson_id}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      )
    }
  }

  const moduleResults = await Promise.allSettled(
    Array.from(moduleIds).map(async (moduleId) => {
      await updateModuleDuration(moduleId)
      return moduleId
    }),
  )

  for (const result of moduleResults) {
    if (result.status === 'rejected') {
      errors.push(
        `Module update failed: ${
          result.reason instanceof Error
            ? result.reason.message
            : String(result.reason)
        }`,
      )
    }
  }

  return { updated, errors }
}

function buildEstimatedMinutesMap(rows: TimedRow[]): Map<string, number> {
  const totalsByLessonId = new Map<string, number>()

  for (const row of rows) {
    const currentTotal = totalsByLessonId.get(row.lesson_id) || 0
    totalsByLessonId.set(
      row.lesson_id,
      currentTotal + (row.estimated_time_minutes || 0),
    )
  }

  return totalsByLessonId
}
