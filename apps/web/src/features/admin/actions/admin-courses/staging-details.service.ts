import { buildCourseDiff } from '../../../../lib/courseDiff'
import { buildCoursePreviewFromPayload, createAdminSupabase } from '../../../../lib/courseImport'
import type { CourseStagingDetails } from './current-course.types'
import { getCurrentCourseStructure } from './current-course-structure.service'

export async function getStagingDetailsAction(stagingId: string): Promise<CourseStagingDetails> {
    const supabase = createAdminSupabase()

    const { data: staging, error } = await supabase
        .from('courses_staging')
        .select(`
            *,
            course:courses!course_id (
                title, slug, thumbnail_url, level, category,
                instructor:users!fk_courses_instructor(first_name, last_name, email, display_name, profile_picture_url)
            )
        `)
        .eq('id', stagingId)
        .single()

    if (error || !staging) {
        throw new Error(error?.message ?? 'Staging row no encontrado')
    }

    const preview = buildCoursePreviewFromPayload(staging)

    if (staging.is_update && staging.course_id) {
        const originalCourse = await getCurrentCourseStructure(supabase, staging.course_id)
        if (originalCourse) {
            const diff = buildCourseDiff(
                originalCourse as unknown as Parameters<typeof buildCourseDiff>[0],
                preview as unknown as Parameters<typeof buildCourseDiff>[1],
            )
            return { ...preview, original_course: originalCourse, diff }
        }
    }

    return preview
}
