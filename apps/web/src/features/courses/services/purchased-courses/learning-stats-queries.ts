import { createClient } from "@/lib/supabase/server";
import { fromLoose } from "@/lib/supabase/looseQuery";
import type { LearningStatsEnrollmentRow, LearningStatsPurchaseRow } from "./learning-stats.types";

export async function queryLearningStatsPurchases(userId: string) {
  const supabase = await createClient();
  return fromLoose<LearningStatsPurchaseRow>(supabase, "course_purchases")
    .select(`
      purchase_id,
      enrollment_id,
      course_id,
      courses!inner (
        id,
        duration_total_minutes
      )
    `)
    .eq("user_id", userId)
    .eq("access_status", "active");
}

export async function queryLearningStatsEnrollments(userId: string, courseIds: string[]) {
  const supabase = await createClient();
  return supabase
    .from("user_course_enrollments")
    .select("enrollment_id, enrollment_status, overall_progress_percentage, course_id")
    .eq("user_id", userId)
    .in("course_id", courseIds)
    .returns<LearningStatsEnrollmentRow[]>();
}
