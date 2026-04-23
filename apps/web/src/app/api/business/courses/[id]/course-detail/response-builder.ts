import { formatCourseReviews } from './reviews'
import { calculateCourseContentStats } from './stats'
import type { CourseRow, ModuleWithLessons } from './types'
import type { CourseReviewRow } from './review-types'

export function buildCourseDetailResponse(
  course: CourseRow,
  instructor: unknown,
  modulesWithLessons: ModuleWithLessons[],
  reviews: CourseReviewRow[],
  subscriptionStatus: Record<string, unknown>,
) {
  const stats = calculateCourseContentStats(modulesWithLessons)

  return {
    success: true,
    course: {
      id: course.id,
      title: course.title,
      description: course.description,
      category: course.category,
      level: course.level,
      instructor,
      duration: course.duration_total_minutes,
      thumbnail_url: course.thumbnail_url,
      slug: course.slug,
      price: course.price,
      rating: course.average_rating || 0,
      student_count: course.student_count || 0,
      review_count: course.review_count || 0,
      learning_objectives: course.learning_objectives || [],
      created_at: course.created_at,
      updated_at: course.updated_at,
      stats: {
        total_modules: stats.totalModules,
        total_lessons: stats.totalLessons,
        total_duration_minutes: stats.totalDuration,
      },
      modules: modulesWithLessons,
      reviews: formatCourseReviews(reviews),
      subscription_status: subscriptionStatus,
    },
  }
}
