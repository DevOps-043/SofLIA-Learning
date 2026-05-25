export interface LearningStatsCourseRow {
  id: string;
  duration_total_minutes: number | null;
}

export interface LearningStatsPurchaseRow {
  purchase_id: string;
  enrollment_id: string | null;
  course_id: string | null;
  courses: LearningStatsCourseRow;
}

export interface LearningStatsEnrollmentRow {
  enrollment_id: string;
  enrollment_status: string | null;
  overall_progress_percentage: number | null;
  course_id: string;
}

export interface EnrolledCourseStatsRow {
  enrollment_id: string;
  enrollment_status: string | null;
  overall_progress_percentage: number | null;
  course_id: string;
  courses: LearningStatsCourseRow;
}
