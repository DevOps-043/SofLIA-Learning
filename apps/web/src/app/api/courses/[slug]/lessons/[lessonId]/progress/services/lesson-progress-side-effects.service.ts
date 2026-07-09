import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>

interface CompletionContext {
  supabase: SupabaseServerClient
  userId: string
  courseId: string
  enrollmentId: string
  courseTitle: string
  lessonId: string
  lessonTitle?: string | null
  instructorId?: string | null
  organizationId?: string | null
  wasCompleted: boolean
  now: string
}

interface CourseSkillRow {
  skill_id: string
  proficiency_level: string | null
  display_order: number | null
}

interface ExistingUserSkillRow {
  skill_id: string
  course_id: string | null
}

function fireAndForget(task: () => Promise<void>) {
  void task().catch(() => undefined)
}

async function notifyLessonCompleted({
  userId,
  courseId,
  courseTitle,
  lessonId,
  lessonTitle,
  organizationId,
}: CompletionContext) {
  if (!lessonTitle) {
    return
  }

  const { AutoNotificationsService } = await import(
    '@/features/notifications/services/auto-notifications.service'
  )
  await AutoNotificationsService.notifyCourseLessonCompleted(
    userId,
    courseId,
    courseTitle,
    lessonId,
    lessonTitle,
    {
      organization_id: organizationId || undefined,
      source: 'lesson_progress',
    },
  )
}

async function syncUserSkills({
  supabase,
  userId,
  courseId,
  enrollmentId,
  wasCompleted,
  now,
}: CompletionContext) {
  if (wasCompleted) {
    return
  }

  const { data: courseSkills } = await supabase
    .from('course_skills')
    .select('skill_id, proficiency_level, display_order, is_primary')
    .eq('course_id', courseId)

  if (!courseSkills || courseSkills.length === 0) {
    return
  }

  const skillIds = courseSkills.map((skill) => skill.skill_id)
  const { data: existingUserSkills } = await supabase
    .from('user_skills')
    .select('skill_id, course_id')
    .eq('user_id', userId)
    .in('skill_id', skillIds)

  const existingSkillIds = new Set(
    (existingUserSkills || []).map((skill) => skill.skill_id),
  )
  const existingFromThisCourse = new Set(
    (existingUserSkills || [])
      .filter((skill) => skill.course_id === courseId)
      .map((skill) => skill.skill_id),
  )

  const newSkills = (courseSkills as CourseSkillRow[]).filter(
    (skill) => !existingSkillIds.has(skill.skill_id),
  )

  if (newSkills.length > 0) {
    const { error } = await supabase.from('user_skills').insert(
      newSkills.map((skill) => ({
        user_id: userId,
        skill_id: skill.skill_id,
        course_id: courseId,
        enrollment_id: enrollmentId,
        proficiency_level: skill.proficiency_level || 'beginner',
        obtained_at: now,
        is_displayed: true,
        display_order: skill.display_order || null,
      })),
    )

    if (error) {
      logger.error('Error asignando skills al usuario:', error)
    }
  }

  const skillIdsFromOtherCourses = (courseSkills as CourseSkillRow[])
    .filter(
      (skill) =>
        existingSkillIds.has(skill.skill_id) &&
        !existingFromThisCourse.has(skill.skill_id),
    )
    .map((skill) => skill.skill_id)

  if (skillIdsFromOtherCourses.length > 0) {
    // Batched refresh (was a 2-queries-per-skill loop). The skill level itself
    // is derived data computed at read time (get_user_skill_levels); here we
    // only refresh the timestamps because a newly completed course changed
    // the counts behind those skills.
    const { error: updateError } = await supabase
      .from('user_skills')
      .update({
        obtained_at: now,
        updated_at: now,
      })
      .eq('user_id', userId)
      .in('skill_id', skillIdsFromOtherCourses)

    if (updateError) {
      logger.warn('Error actualizando skills existentes del usuario:', updateError)
    }
  }
}

async function handleCourseCompletion({
  supabase,
  userId,
  courseId,
  enrollmentId,
  courseTitle,
  organizationId,
  wasCompleted,
  now,
}: CompletionContext) {
  try {
    await syncUserSkills({
      supabase,
      userId,
      courseId,
      enrollmentId,
      courseTitle,
      lessonId: '',
      wasCompleted,
      now,
    })

    const { AutoNotificationsService } = await import(
      '@/features/notifications/services/auto-notifications.service'
    )
    await AutoNotificationsService.notifyCourseCompleted(
      userId,
      courseId,
      courseTitle,
      false,
      {
        organization_id: organizationId || undefined,
        source: 'lesson_progress',
      },
    )

    if (!wasCompleted) {
      const { generateCourseCompendium } = await import(
        '@/features/courses/services/course-compendium.service'
      )
      const compendium = await generateCourseCompendium({
        allowUpdate: false,
        courseId,
        courseTitle,
        enrollmentId,
        organizationId: organizationId ?? null,
        userId,
      })
      logger.info('Course compendium auto-generation', {
        courseId,
        error: compendium.error,
        reason: compendium.reason,
        status: compendium.status,
        userId,
      })
    }
  } catch (error) {
    logger.error('Error ejecutando side effects de curso completado:', error)
  }
}

export function triggerLessonProgressSideEffects(
  completionContext: CompletionContext,
  overallProgress: number,
) {
  fireAndForget(() => notifyLessonCompleted(completionContext))

  if (overallProgress === 100) {
    fireAndForget(() => handleCourseCompletion(completionContext))
  }
}
