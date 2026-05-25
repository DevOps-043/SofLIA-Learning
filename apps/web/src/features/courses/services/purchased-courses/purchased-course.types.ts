export interface PurchasedCourse {
  purchase_id: string;
  course_id: string;
  course_title: string;
  course_description: string;
  course_thumbnail: string;
  course_slug: string;
  course_category: string;
  instructor_name: string;
  access_status: "active" | "suspended" | "expired" | "cancelled";
  purchased_at: string;
  access_granted_at: string;
  expires_at?: string;
  enrollment_id: string;
  enrollment_status: string;
  progress_percentage: number;
  last_accessed_at: string;
  started_at: string;
  course_duration_minutes: number;
  estimated_duration?: number;
  difficulty?: string;
}

export interface PurchasedCourseInstructorRow {
  id: string;
  first_name: string | null;
  last_name: string | null;
  username: string | null;
}

export interface PurchasedCourseDetailsRow {
  id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  slug: string;
  category: string;
  duration_total_minutes: number | null;
  level: string | null;
  instructor_id: string | null;
  instructor: PurchasedCourseInstructorRow | null;
}

export interface PurchasedCourseEnrollmentRow {
  enrollment_status: string | null;
  overall_progress_percentage: number | null;
  last_accessed_at: string | null;
  started_at: string | null;
}

export interface PurchasedCourseRow {
  purchase_id: string;
  access_status: PurchasedCourse["access_status"];
  purchased_at: string;
  access_granted_at: string;
  expires_at: string | null;
  enrollment_id: string | null;
  courses: PurchasedCourseDetailsRow;
  user_course_enrollments: PurchasedCourseEnrollmentRow[] | null;
}

export interface EnrolledCourseRow {
  enrollment_id: string;
  enrollment_status: string | null;
  overall_progress_percentage: number | null;
  last_accessed_at: string | null;
  started_at: string | null;
  enrolled_at: string | null;
  course_id: string;
  courses: PurchasedCourseDetailsRow;
}

export interface LearningStats {
  total_courses: number;
  completed_courses: number;
  in_progress_courses: number;
  total_time_minutes: number;
  average_progress: number;
}
