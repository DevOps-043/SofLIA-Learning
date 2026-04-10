import { createClient } from '@/lib/supabase/server'

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>

type UserProfileRow = {
  id: string
}

export interface CourseTrackingSummary {
  course: {
    courseId: string
    enrollmentId: string
    organizationId: string | null
  }
  questionnaire: {
    answeredCount: number
    lastAnsweredAt: string | null
  }
  quizzes: {
    submittedCount: number
    passedCount: number
    latestSubmittedAt: string | null
  }
  activities: {
    submittedCount: number
    validatedCount: number
    needsRevisionCount: number
    latestSubmittedAt: string | null
    latestValidationAt: string | null
  }
}

async function resolveCourseContext(
  supabase: SupabaseServerClient,
  userId: string,
  slug: string,
) {
  const { data: course, error: courseError } = await supabase
    .from('courses')
    .select('id')
    .eq('slug', slug)
    .single()

  if (courseError || !course) {
    return null
  }

  const { data: enrollment } = await supabase
    .from('user_course_enrollments')
    .select('enrollment_id, organization_id')
    .eq('user_id', userId)
    .eq('course_id', course.id)
    .single()

  if (!enrollment) {
    return null
  }

  return {
    courseId: course.id,
    enrollmentId: enrollment.enrollment_id,
    organizationId: enrollment.organization_id,
  }
}

async function resolveUserProfileId(
  supabase: SupabaseServerClient,
  userId: string,
) {
  const { data: profile } = await supabase
    .from('user_perfil')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle()

  return (profile as UserProfileRow | null)?.id ?? null
}

function getLatestTimestamp(
  rows: Array<Record<string, string | null>>,
  key: string,
): string | null {
  return rows.reduce<string | null>((latest, row) => {
    const candidate = row[key]
    if (!candidate) {
      return latest
    }

    if (!latest) {
      return candidate
    }

    return candidate > latest ? candidate : latest
  }, null)
}

export async function getCourseTrackingSummary(
  supabase: SupabaseServerClient,
  userId: string,
  slug: string,
): Promise<CourseTrackingSummary | null> {
  const courseContext = await resolveCourseContext(supabase, userId, slug)
  if (!courseContext) {
    return null
  }

  const userProfileId = await resolveUserProfileId(supabase, userId)

  const [questionnaireResponses, quizSubmissions, activitySubmissions] =
    await Promise.all([
      userProfileId
        ? supabase
            .from('respuestas')
            .select('respondido_en')
            .eq('user_perfil_id', userProfileId)
        : Promise.resolve({ data: [] as Array<{ respondido_en: string }> }),
      supabase
        .from('user_quiz_submissions')
        .select('completed_at, is_passed')
        .eq('user_id', userId)
        .eq('enrollment_id', courseContext.enrollmentId),
      supabase
        .from('user_activity_submissions')
        .select('submitted_at, last_validated_at, status')
        .eq('user_id', userId)
        .eq('enrollment_id', courseContext.enrollmentId),
    ])

  const questionnaireRows =
    questionnaireResponses.data || ([] as Array<{ respondido_en: string }>)
  const quizRows =
    quizSubmissions.data ||
    ([] as Array<{ completed_at: string | null; is_passed: boolean | null }>)
  const activityRows =
    activitySubmissions.data ||
    ([] as Array<{
      submitted_at: string | null
      last_validated_at: string | null
      status: string | null
    }>)

  return {
    course: courseContext,
    questionnaire: {
      answeredCount: questionnaireRows.length,
      lastAnsweredAt: getLatestTimestamp(questionnaireRows, 'respondido_en'),
    },
    quizzes: {
      submittedCount: quizRows.length,
      passedCount: quizRows.filter((row) => row.is_passed).length,
      latestSubmittedAt: getLatestTimestamp(quizRows, 'completed_at'),
    },
    activities: {
      submittedCount: activityRows.length,
      validatedCount: activityRows.filter((row) => row.status === 'validated')
        .length,
      needsRevisionCount: activityRows.filter(
        (row) => row.status === 'needs_revision',
      ).length,
      latestSubmittedAt: getLatestTimestamp(activityRows, 'submitted_at'),
      latestValidationAt: getLatestTimestamp(activityRows, 'last_validated_at'),
    },
  }
}
