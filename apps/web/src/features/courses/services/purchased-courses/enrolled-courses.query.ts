import { createClient } from "@/lib/supabase/server";
import { mapEnrollmentToPurchasedCourse } from "./purchased-course.mapper";
import type { EnrolledCourseRow, PurchasedCourse } from "./purchased-course.types";

export async function getUserEnrolledCourses(userId: string): Promise<PurchasedCourse[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("user_course_enrollments")
    .select(`
      enrollment_id,
      enrollment_status,
      overall_progress_percentage,
      last_accessed_at,
      started_at,
      enrolled_at,
      course_id,
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
      )
    `)
    .returns<EnrolledCourseRow[]>()
    .eq("user_id", userId)
    .neq("enrollment_status", "cancelled")
    .order("enrolled_at", { ascending: false });

  if (error) throw error;

  return (data || []).map(mapEnrollmentToPurchasedCourse);
}

export async function isCourseEnrolled(userId: string, courseId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data: enrollment, error } = await supabase
    .from("user_course_enrollments")
    .select("enrollment_id")
    .eq("user_id", userId)
    .eq("course_id", courseId)
    .neq("enrollment_status", "cancelled")
    .limit(1)
    .maybeSingle();

  if (error && error.code !== "PGRST116") {
    return false;
  }

  return !!enrollment;
}
