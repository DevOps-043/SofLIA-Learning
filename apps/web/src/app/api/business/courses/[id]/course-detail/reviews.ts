import { logger } from '@/lib/utils/logger'
import type { CourseReviewRow } from './review-types'
import type { SupabaseServerClient } from './types'

export async function loadRecentCourseReviews(
  supabase: SupabaseServerClient,
  courseId: string,
) {
  try {
    const { data, error } = await supabase
      .from('course_reviews')
      .select(`
        review_id,
        review_title,
        review_content,
        rating,
        is_verified,
        created_at,
        user_id,
        users!inner (display_name, first_name, last_name, username, profile_picture_url)
      `)
      .eq('course_id', courseId)
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .limit(10)
      .returns<CourseReviewRow[]>()

    if (error) {
      logger.warn('Error fetching reviews (non-critical):', error)
      return []
    }
    return data || []
  } catch (error) {
    logger.warn('Exception fetching reviews (non-critical):', error)
    return []
  }
}

export function formatCourseReviews(reviews: CourseReviewRow[]) {
  return reviews.map((review) => ({
    id: review.review_id,
    title: review.review_title,
    content: review.review_content,
    rating: review.rating,
    is_verified: review.is_verified,
    created_at: review.created_at,
    user: {
      name:
        review.users?.display_name ||
        `${review.users?.first_name || ''} ${review.users?.last_name || ''}`.trim() ||
        review.users?.username ||
        'Usuario',
      profile_picture_url: review.users?.profile_picture_url,
    },
  }))
}
