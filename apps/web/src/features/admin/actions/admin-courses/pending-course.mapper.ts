import type { AdminCourse, CoursePayload, StagingInstructor, StagingRow } from './staging.types'

function firstOrNull<T>(value: T | T[] | null | undefined): T | null {
    return Array.isArray(value) ? value[0] ?? null : value ?? null
}

function resolveInstructorName(
    existingInstructor: StagingInstructor | null | undefined,
    coursePayload: CoursePayload,
) {
    if (existingInstructor) {
        const fullName = `${existingInstructor.first_name ?? ''} ${existingInstructor.last_name ?? ''}`.trim()
        return fullName || existingInstructor.email
    }

    return coursePayload.instructor_email || 'Desconocido'
}

export function mapStagingRowToAdminCourse(row: StagingRow): AdminCourse {
    const coursePayload: CoursePayload = row.payload?.course ?? {}
    const existingCourse = firstOrNull(row.course)
    const existingInstructor = firstOrNull(existingCourse?.instructor)

    const title = coursePayload.title || existingCourse?.title || 'Sin título'
    const description = coursePayload.description || existingCourse?.description || ''
    const level = coursePayload.level || existingCourse?.level || 'beginner'
    const category = coursePayload.category || existingCourse?.category || 'General'
    const thumbnailUrl = coursePayload.thumbnail_url ?? existingCourse?.thumbnail_url ?? undefined

    return {
        id: row.id,
        title,
        description,
        slug: row.source_slug,
        category,
        level,
        thumbnail_url: thumbnailUrl,
        is_active: false,
        created_at: row.submitted_at,
        updated_at: row.updated_at ?? row.submitted_at,
        instructor_name: resolveInstructorName(existingInstructor, coursePayload),
        duration_total_minutes: 0,
        duration_hours: 0,
        approval_status: row.status as 'pending' | 'approved' | 'rejected',
        is_update: row.is_update,
        rejection_reason: row.rejection_reason ?? undefined,
    }
}
