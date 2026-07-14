import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'
import {
  enqueueCourseCompletionNotebookJobs,
  enqueueLessonAutoNoteJob,
} from '@/features/notebook/services/notebook-generation.server.service'
import { resolveQueuedJobState } from '@/features/notebook/services/notebook-generation.helpers'
import type { GenerationState } from '@/features/notebook/types'

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
    // Antes se otorgaban skills al usuario (tabla `user_skills`), pero esa
    // tabla no existe: la escritura fallaba en silencio en CADA compleción de
    // curso. La feature de skills quedó a medio construir y se retiró.
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

  } catch (error) {
    logger.error('Error ejecutando side effects de curso completado:', error)
  }
}

export async function triggerLessonProgressSideEffects(
  completionContext: CompletionContext,
  overallProgress: number,
): Promise<{
  lesson?: GenerationState
  compendium?: GenerationState
}> {
  fireAndForget(() => notifyLessonCompleted(completionContext))

  if (!completionContext.organizationId) {
    logger.warn('Notebook generation skipped without organization scope', {
      courseId: completionContext.courseId,
      lessonId: completionContext.lessonId,
      userId: completionContext.userId,
    })
    return {}
  }

  const lessonJob = await enqueueLessonAutoNoteJob({
    courseId: completionContext.courseId,
    enrollmentId: completionContext.enrollmentId,
    lessonId: completionContext.lessonId,
    organizationId: completionContext.organizationId,
    priority: 50,
    sourceVersion: completionContext.now,
    userId: completionContext.userId,
  })
  const notebookGeneration: {
    lesson?: GenerationState
    compendium?: GenerationState
  } = { lesson: resolveQueuedJobState(lessonJob) }

  if (overallProgress === 100) {
    fireAndForget(() => handleCourseCompletion(completionContext))
    const courseJobs = await enqueueCourseCompletionNotebookJobs({
      courseId: completionContext.courseId,
      enrollmentId: completionContext.enrollmentId,
      organizationId: completionContext.organizationId,
      userId: completionContext.userId,
    })
    notebookGeneration.compendium = courseJobs.compendium.state
  }

  return notebookGeneration
}
