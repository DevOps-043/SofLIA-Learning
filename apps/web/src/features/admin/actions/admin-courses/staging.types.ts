export interface StagingInstructor {
    first_name: string | null
    last_name: string | null
    email: string
}

export interface StagingCourseRef {
    title: string
    slug: string
    thumbnail_url?: string | null
    level: string
    category: string
    description?: string
    instructor?: StagingInstructor | StagingInstructor[] | null
}

export interface CoursePayload {
    title?: string
    description?: string
    level?: string
    category?: string
    thumbnail_url?: string | null
    instructor_email?: string
    course?: CoursePayload
    [key: string]: unknown
}

export interface StagingRow {
    id: string
    course_id: string | null
    source_slug: string
    is_update: boolean
    submitted_at: string
    updated_at: string | null
    status: string
    rejection_reason: string | null
    payload: CoursePayload
    course: StagingCourseRef | StagingCourseRef[] | null
}

export interface AdminCourse {
    id: string
    title: string
    description: string
    slug: string
    category: string
    level: string
    thumbnail_url?: string
    is_active: boolean
    created_at: string
    updated_at: string
    instructor_name?: string
    duration_total_minutes: number
    duration_hours?: number
    approval_status: 'pending' | 'approved' | 'rejected'
    is_update: boolean
    rejection_reason?: string
}
