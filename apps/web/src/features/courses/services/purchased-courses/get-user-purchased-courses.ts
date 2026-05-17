import { createClient } from "@/lib/supabase/server";
import {
  isMissingCoursePurchasesError,
  markCoursePurchasesUnavailable,
  shouldSkipCoursePurchasesTable,
} from "./course-purchases-availability";
import { getUserEnrolledCourses } from "./enrolled-courses.query";
import { mapPurchaseToPurchasedCourse } from "./purchased-course.mapper";
import type { PurchasedCourse, PurchasedCourseRow } from "./purchased-course.types";

export async function getUserPurchasedCourses(userId: string): Promise<PurchasedCourse[]> {
  if (shouldSkipCoursePurchasesTable()) {
    return getUserEnrolledCourses(userId);
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("course_purchases")
    .select(`
      purchase_id,
      access_status,
      purchased_at,
      access_granted_at,
      expires_at,
      enrollment_id,
      courses!inner (
        id,
        title,
        description,
        thumbnail_url,
        slug,
        category,
        duration_total_minutes,
        level,
        instructor_id,
        instructor:users!instructor_id (
          id,
          first_name,
          last_name,
          username
        )
      ),
      user_course_enrollments (
        enrollment_status,
        overall_progress_percentage,
        last_accessed_at,
        started_at
      )
    `)
    .returns<PurchasedCourseRow[]>()
    .eq("user_id", userId)
    .eq("access_status", "active")
    .order("purchased_at", { ascending: false });

  if (error) {
    if (isMissingCoursePurchasesError(error)) {
      markCoursePurchasesUnavailable();
      return getUserEnrolledCourses(userId);
    }

    throw error;
  }

  return (data || []).map(mapPurchaseToPurchasedCourse);
}
