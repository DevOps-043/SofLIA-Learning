import { createClient } from "@/lib/supabase/server";
import type { EnrolledCourseStatsRow } from "./learning-stats.types";
import type { LearningStats } from "./purchased-course.types";

export async function getUserLearningStatsFromEnrollments(userId: string): Promise<LearningStats> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("user_course_enrollments")
    .select(`
      enrollment_id,
      enrollment_status,
      overall_progress_percentage,
      course_id,
      courses!inner (
        id,
        duration_total_minutes
      )
    `)
    .eq("user_id", userId)
    .neq("enrollment_status", "cancelled")
    .returns<EnrolledCourseStatsRow[]>();

  if (error) throw error;

  let progressTotal = 0;
  let enrollmentsWithProgress = 0;
  const stats = (data || []).reduce<LearningStats>(
    (stats, enrollment) => {
      const progress = Number(enrollment.overall_progress_percentage) || 0;
      const status = enrollment.enrollment_status;

      stats.total_courses += 1;
      stats.total_time_minutes += enrollment.courses?.duration_total_minutes || 0;
      progressTotal += progress;
      enrollmentsWithProgress += 1;

      if (status === "completed" || progress >= 100) {
        stats.completed_courses += 1;
      } else if (progress > 0 && progress < 100 && status !== "paused") {
        stats.in_progress_courses += 1;
      }

      return stats;
    },
    { total_courses: 0, completed_courses: 0, in_progress_courses: 0, total_time_minutes: 0, average_progress: 0 },
  );

  stats.average_progress = enrollmentsWithProgress > 0 ? progressTotal / enrollmentsWithProgress : 0;
  return stats;
}
