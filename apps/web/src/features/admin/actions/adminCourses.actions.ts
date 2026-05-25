'use server'

import {
    approveCourseAction,
    deleteCourseAction,
    reconsiderCourseAction,
    rejectCourseAction,
} from './admin-courses/course-review-mutations.service'
import { getPendingCoursesAction } from './admin-courses/pending-courses.service'
import { getStagingDetailsAction } from './admin-courses/staging-details.service'
import type { AdminCourse } from './admin-courses/staging.types'

export type { AdminCourse }

export async function getPendingCourses(): Promise<AdminCourse[]> {
    return getPendingCoursesAction()
}

export async function getStagingDetails(stagingId: string) {
    return getStagingDetailsAction(stagingId)
}

export async function approveCourse(stagingId: string, adminId: string): Promise<boolean> {
    return approveCourseAction(stagingId, adminId)
}

export async function rejectCourse(stagingId: string, reason: string): Promise<boolean> {
    return rejectCourseAction(stagingId, reason)
}

export async function deleteCourse(stagingId: string): Promise<boolean> {
    return deleteCourseAction(stagingId)
}

export async function reconsiderCourse(stagingId: string): Promise<boolean> {
    return reconsiderCourseAction(stagingId)
}
