import { NextResponse } from 'next/server'
import { requireBusiness } from '@/lib/auth/requireBusiness'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'
import { loadCourseById } from './course-loader'
import {
  BusinessCourseDetailError,
  createErrorResponse,
  createUnexpectedErrorResponse,
} from './errors'
import { loadCourseInstructor } from './instructor'
import { loadModulesWithLessons } from './modules'
import { buildCourseDetailResponse } from './response-builder'
import { loadRecentCourseReviews } from './reviews'
import { resolveSubscriptionStatus } from './subscription-status'
import { validateCourseId } from './validation'

export async function handleBusinessCourseDetailRequest(
  params: Promise<{ id: string }>,
) {
  try {
    const auth = await requireBusiness()
    if (auth instanceof NextResponse) {
      logger.error('Authentication failed in /api/business/courses/[id]')
      return auth
    }

    const { id } = await params
    validateCourseId(id)
    const supabase = await createClient()
    const course = await loadCourseById(supabase, id)
    const [instructor, modulesWithLessons, reviews, subscriptionStatus] =
      await Promise.all([
        loadCourseInstructor(supabase, course),
        loadModulesWithLessons(supabase, course.id),
        loadRecentCourseReviews(supabase, course.id),
        resolveSubscriptionStatus(supabase, auth.organizationId, course),
      ])

    return NextResponse.json(
      buildCourseDetailResponse(
        course,
        instructor,
        modulesWithLessons,
        reviews,
        subscriptionStatus,
      ),
    )
  } catch (error) {
    if (error instanceof BusinessCourseDetailError) {
      return createErrorResponse(error)
    }

    const message = error instanceof Error ? error.message : 'Error desconocido'
    logger.error('Error in /api/business/courses/[id]:', error)
    return createUnexpectedErrorResponse(message)
  }
}
