import { logger as techDebtLogger } from '@/lib/utils/logger'
import { revalidatePath } from 'next/cache'
import { SessionService } from '../../../auth/services/session.service'
import { createAdminSupabase } from '../../../../lib/courseImport'
import { approveCourseReview } from './approve-course.service'

export async function approveCourseAction(stagingId: string, _adminId: string): Promise<boolean> {
    return approveCourseReview(stagingId)
}

export async function rejectCourseAction(stagingId: string, reason: string): Promise<boolean> {
    const user = await SessionService.getCurrentUser()
    const supabase = createAdminSupabase()

    const { error } = await supabase
        .from('courses_staging')
        .update({
            status: 'rejected',
            rejection_reason: reason,
            reviewed_by: user?.id ?? null,
            reviewed_at: new Date().toISOString(),
        })
        .eq('id', stagingId)

    if (error) {
        techDebtLogger.error('Error rejecting course:', error)
        return false
    }

    revalidatePath('/admin/courses/pending')
    return true
}

export async function deleteCourseAction(stagingId: string): Promise<boolean> {
    const supabase = createAdminSupabase()
    const { error } = await supabase.from('courses_staging').delete().eq('id', stagingId)

    if (error) {
        techDebtLogger.error('Error deleting staging course:', error)
        return false
    }

    revalidatePath('/admin/courses/pending')
    return true
}

export async function reconsiderCourseAction(stagingId: string): Promise<boolean> {
    const supabase = createAdminSupabase()

    const { error } = await supabase
        .from('courses_staging')
        .update({ status: 'pending', rejection_reason: null, reviewed_by: null, reviewed_at: null })
        .eq('id', stagingId)

    if (error) {
        techDebtLogger.error('Error reconsidering course:', error)
        return false
    }

    revalidatePath('/admin/courses/pending')
    return true
}
