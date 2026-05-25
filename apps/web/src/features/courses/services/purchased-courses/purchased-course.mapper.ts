import type {
  EnrolledCourseRow,
  PurchasedCourse,
  PurchasedCourseInstructorRow,
  PurchasedCourseRow,
} from "./purchased-course.types";

export function getInstructorName(instructor: PurchasedCourseInstructorRow | null): string {
  if (!instructor) return "Instructor";

  return `${instructor.first_name || ""} ${instructor.last_name || ""}`.trim() ||
    instructor.username ||
    "Instructor";
}

export function mapEnrollmentToPurchasedCourse(enrollment: EnrolledCourseRow): PurchasedCourse {
  const course = enrollment.courses;
  const enrolledAt = enrollment.enrolled_at || new Date().toISOString();

  return {
    purchase_id: enrollment.enrollment_id,
    course_id: course.id,
    course_title: course.title,
    course_description: course.description || "",
    course_thumbnail: course.thumbnail_url || "",
    course_slug: course.slug,
    course_category: course.category,
    instructor_name: getInstructorName(course.instructor),
    access_status: "active",
    purchased_at: enrolledAt,
    access_granted_at: enrolledAt,
    expires_at: undefined,
    enrollment_id: enrollment.enrollment_id,
    enrollment_status: enrollment.enrollment_status || "active",
    progress_percentage: enrollment.overall_progress_percentage || 0,
    last_accessed_at: enrollment.last_accessed_at || enrolledAt,
    started_at: enrollment.started_at || enrolledAt,
    course_duration_minutes: course.duration_total_minutes || 0,
    estimated_duration: course.duration_total_minutes || 0,
    difficulty: course.level || "beginner",
  };
}

export function mapPurchaseToPurchasedCourse(purchase: PurchasedCourseRow): PurchasedCourse {
  const course = purchase.courses;
  const enrollment = purchase.user_course_enrollments?.[0];

  return {
    purchase_id: purchase.purchase_id,
    course_id: course.id,
    course_title: course.title,
    course_description: course.description || "",
    course_thumbnail: course.thumbnail_url || "",
    course_slug: course.slug,
    course_category: course.category,
    instructor_name: getInstructorName(course.instructor),
    access_status: purchase.access_status,
    purchased_at: purchase.purchased_at,
    access_granted_at: purchase.access_granted_at,
    expires_at: purchase.expires_at,
    enrollment_id: purchase.enrollment_id || "",
    enrollment_status: enrollment?.enrollment_status || "active",
    progress_percentage: enrollment?.overall_progress_percentage || 0,
    last_accessed_at: enrollment?.last_accessed_at || purchase.purchased_at,
    started_at: enrollment?.started_at || purchase.purchased_at,
    course_duration_minutes: course.duration_total_minutes || 0,
    estimated_duration: course.duration_total_minutes || 0,
    difficulty: course.level || "beginner",
  };
}
