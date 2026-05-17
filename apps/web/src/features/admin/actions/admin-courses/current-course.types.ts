import { buildCourseDiff } from '../../../../lib/courseDiff'
import { buildCoursePreviewFromPayload } from '../../../../lib/courseImport'

export interface CurrentCourseLesson {
    lesson_id: string
    lesson_title: string
    lesson_order_index: number | null
    duration_seconds: number | null
    video_provider: string | null
    video_provider_id: string | null
    transcript_content: string | null
    summary_content: string | null
    materials: Array<{
        material_id: string
        material_title: string | null
        material_type: string | null
        external_url: string | null
        file_url: string | null
        content_data: unknown
    }>
    activities: Array<{
        activity_id: string
        activity_title: string | null
        activity_type: string | null
        activity_content: unknown
        activity_order_index: number | null
    }>
}

export interface CurrentCourseModule {
    module_id: string
    module_title: string | null
    module_order_index: number | null
    is_published: boolean | null
    lessons: CurrentCourseLesson[]
}

export interface CurrentCourseStructure {
    title: string
    description: string | null
    level: string | null
    category: string | null
    thumbnail_url: string | null
    slug: string | null
    instructor?: unknown
    modules: CurrentCourseModule[]
}

export type CoursePreview = ReturnType<typeof buildCoursePreviewFromPayload>

export interface CourseStagingDetails extends CoursePreview {
    original_course?: CurrentCourseStructure
    diff?: ReturnType<typeof buildCourseDiff>
}
