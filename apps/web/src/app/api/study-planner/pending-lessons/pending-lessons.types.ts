export interface CourseInfo {
  id: string;
  title: string;
  description?: string | null;
}

export interface CourseSource {
  course_id: string;
  due_date: string | null;
  source: 'enrollment' | 'org_assignment' | 'hierarchy_assignment';
  courseInfo?: CourseInfo;
}

export interface CourseAssignmentRow {
  course_id: string;
  due_date: string | null;
  courses: CourseInfo | CourseInfo[] | null;
}

export interface EnrollmentRow {
  course_id: string;
  courses: CourseInfo | CourseInfo[] | null;
}

export interface ModuleData {
  module_id: string;
  module_title: string;
  module_order_index: number;
  is_published: boolean;
}

export interface LessonData {
  lesson_id: string;
  lesson_title: string;
  lesson_description: string | null;
  lesson_order_index: number;
  duration_seconds: number | null;
  total_duration_minutes: number | null;
  module_id: string;
  is_published: boolean;
}

export interface ProgressData {
  lesson_id: string;
  lesson_status: string | null;
  is_completed: boolean;
}

export interface PendingLessonWithModule {
  lessonId: string;
  lessonTitle: string;
  lessonOrderIndex: number;
  durationMinutes: number;
  durationSeconds: number;
  moduleId: string;
  moduleTitle: string;
  moduleOrderIndex: number;
}

export interface PendingLessonsCourseSummary {
  courseId: string;
  courseTitle: string;
  dueDate: string | null;
  totalLessons: number;
  completedLessons: number;
  pendingLessons: PendingLessonWithModule[];
  pendingCount: number;
}
