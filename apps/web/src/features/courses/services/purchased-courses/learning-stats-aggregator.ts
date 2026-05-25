import type { LearningStatsEnrollmentRow, LearningStatsPurchaseRow } from "./learning-stats.types";
import type { LearningStats } from "./purchased-course.types";

export function buildEnrollmentsByCourseId(enrollments: LearningStatsEnrollmentRow[] | null) {
  const enrollmentsMap = new Map<string, LearningStatsEnrollmentRow>();

  enrollments?.forEach(enrollment => {
    const existing = enrollmentsMap.get(enrollment.course_id);
    const nextProgress = Number(enrollment.overall_progress_percentage);
    const existingProgress = Number(existing?.overall_progress_percentage);

    if (!existing || enrollment.enrollment_status === "completed" || nextProgress > existingProgress) {
      enrollmentsMap.set(enrollment.course_id, enrollment);
    }
  });

  return enrollmentsMap;
}

export function summarizeLearningStats(
  purchases: LearningStatsPurchaseRow[],
  enrollmentsMap: Map<string, LearningStatsEnrollmentRow>,
): LearningStats {
  let progressTotal = 0;
  let enrollmentsWithProgress = 0;

  const stats = purchases.reduce<LearningStats>(
    (current, purchase) => {
      current.total_time_minutes += purchase.courses?.duration_total_minutes || 0;
      const enrollment = purchase.courses?.id ? enrollmentsMap.get(purchase.courses.id) : null;

      if (enrollment) {
        const status = enrollment.enrollment_status;
        const progress = Number(enrollment.overall_progress_percentage) || 0;
        const isCompleted = status === "completed" || progress >= 100;
        const isInProgress = progress > 0 && progress < 100 && !isCompleted && status !== "cancelled" && status !== "paused";

        enrollmentsWithProgress++;
        progressTotal += progress;
        if (isCompleted) current.completed_courses++;
        else if (isInProgress) current.in_progress_courses++;
      }

      return current;
    },
    { total_courses: purchases.length, completed_courses: 0, in_progress_courses: 0, total_time_minutes: 0, average_progress: 0 },
  );

  stats.average_progress = enrollmentsWithProgress > 0 ? progressTotal / enrollmentsWithProgress : 0;
  return stats;
}
