import {
  isMissingCoursePurchasesError,
  markCoursePurchasesUnavailable,
  shouldSkipCoursePurchasesTable,
} from "./course-purchases-availability";
import { buildEnrollmentsByCourseId, summarizeLearningStats } from "./learning-stats-aggregator";
import { getUserLearningStatsFromEnrollments } from "./learning-stats-enrollments";
import { queryLearningStatsEnrollments, queryLearningStatsPurchases } from "./learning-stats-queries";
import type { LearningStats } from "./purchased-course.types";

const EMPTY_LEARNING_STATS: LearningStats = {
  total_courses: 0,
  completed_courses: 0,
  in_progress_courses: 0,
  total_time_minutes: 0,
  average_progress: 0,
};

export async function getUserLearningStats(userId: string): Promise<LearningStats> {
  if (shouldSkipCoursePurchasesTable()) {
    return getUserLearningStatsFromEnrollments(userId);
  }

  const { data: purchases, error: purchasesError } = await queryLearningStatsPurchases(userId);

  if (purchasesError) {
    if (isMissingCoursePurchasesError(purchasesError)) {
      markCoursePurchasesUnavailable();
      return getUserLearningStatsFromEnrollments(userId);
    }

    throw purchasesError;
  }

  if (!purchases || purchases.length === 0) {
    return EMPTY_LEARNING_STATS;
  }

  const courseIds = purchases
    .map(purchase => purchase.course_id)
    .filter((id: string | null): id is string => id !== null && id !== undefined);

  if (courseIds.length === 0) {
    return summarizeLearningStats(purchases, new Map());
  }

  const { data: enrollments, error: enrollmentsError } = await queryLearningStatsEnrollments(userId, courseIds);
  if (enrollmentsError) throw enrollmentsError;

  return summarizeLearningStats(purchases, buildEnrollmentsByCourseId(enrollments));
}
