import { logger as techDebtLogger } from '@/lib/utils/logger'
import { SELECT_COLUMNS } from '@/lib/supabase/select-types'
import { revalidatePath } from 'next/cache'
import { SessionService } from '../../../auth/services/session.service'
import {
    createAdminSupabase,
    createNewCourseFromPayload,
    resolveInstructorFromPayload,
    updateExistingCourseFromPayload,
} from '../../../../lib/courseImport'

async function publishCourseContent(
    supabase: ReturnType<typeof createAdminSupabase>,
    courseId: string,
) {
    await supabase.from('course_modules').update({ is_published: true }).eq('course_id', courseId)
    const { data: modules } = await supabase.from('course_modules').select('module_id').eq('course_id', courseId)

    if (modules && modules.length > 0) {
        const moduleIds = modules.map((module: { module_id: string }) => module.module_id)
        await supabase.from('course_lessons').update({ is_published: true }).in('module_id', moduleIds)
    }
}

async function markStagingApproved(
    supabase: ReturnType<typeof createAdminSupabase>,
    stagingId: string,
    courseId: string,
    adminId: string,
) {
    await supabase
        .from('courses_staging')
        .update({
            status: 'approved',
            reviewed_by: adminId,
            reviewed_at: new Date().toISOString(),
            course_id: courseId,
        })
        .eq('id', stagingId)
}

export async function approveCourseReview(stagingId: string): Promise<boolean> {
    const user = await SessionService.getCurrentUser()
    const effectiveAdminId = user?.id

    if (!effectiveAdminId) {
        techDebtLogger.error('[APPROVE_ERROR] No admin identified')
        return false
    }

    const supabase = createAdminSupabase()
    const { data: staging, error: stagingError } = await supabase
        .from('courses_staging')
        .select(SELECT_COLUMNS.courses_staging)
        .eq('id', stagingId)
        .single()

    if (stagingError || !staging) {
        techDebtLogger.error('[APPROVE_ERROR] Staging row not found:', stagingError)
        return false
    }

    try {
        const instructorId = await resolveInstructorFromPayload(supabase, staging.payload)
        const courseId =
            staging.is_update && staging.course_id
                ? staging.course_id
                : await createNewCourseFromPayload(supabase, staging.payload, instructorId, effectiveAdminId)

        if (staging.is_update && staging.course_id) {
            await updateExistingCourseFromPayload(supabase, courseId, staging.payload, instructorId, effectiveAdminId)
        }

        await publishCourseContent(supabase, courseId)
        await markStagingApproved(supabase, stagingId, courseId, effectiveAdminId)
        revalidatePath('/admin/courses/pending')
        return true
    } catch (err: unknown) {
        techDebtLogger.error('[APPROVE_ERROR]', err instanceof Error ? err.message : String(err))
        return false
    }
}
