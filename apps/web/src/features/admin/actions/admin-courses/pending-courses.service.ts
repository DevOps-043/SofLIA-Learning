import { createAdminSupabase } from '../../../../lib/courseImport'
import { mapStagingRowToAdminCourse } from './pending-course.mapper'
import type { AdminCourse, StagingRow } from './staging.types'

export async function getPendingCoursesAction(): Promise<AdminCourse[]> {
    const supabase = createAdminSupabase()

    const { data, error } = await supabase
        .from('courses_staging')
        .select(`
            id,
            course_id,
            source_slug,
            is_update,
            submitted_at,
            updated_at,
            status,
            rejection_reason,
            payload,
            course:courses!course_id (
                title,
                slug,
                thumbnail_url,
                level,
                category,
                instructor:users!fk_courses_instructor(first_name, last_name, email)
            )
        `)
        .in('status', ['pending', 'rejected'])
        .order('submitted_at', { ascending: false })

    if (error) {
        console.error('Error fetching staging courses:', error)
        throw new Error(error.message)
    }

    return ((data ?? []) as StagingRow[]).map(mapStagingRowToAdminCourse)
}
