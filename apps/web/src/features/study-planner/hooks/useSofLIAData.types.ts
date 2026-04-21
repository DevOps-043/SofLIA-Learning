export interface LessonData {
  lessonId: string;
  lessonTitle: string;
  lessonOrderIndex: number;
  durationMinutes: number;
  moduleId: string;
  moduleTitle: string;
  moduleOrderIndex: number;
  courseId: string;
  courseTitle: string;
}

export interface CourseData {
  courseId: string;
  courseTitle: string;
  dueDate: string | null;
  totalLessons: number;
  completedLessons: number;
  pendingCount: number;
}

export interface LessonDataResponse {
  lessonId: string;
  lessonTitle: string;
  lessonOrderIndex?: number | null;
  durationMinutes?: number | null;
  moduleId?: string | null;
  moduleTitle?: string | null;
  moduleOrderIndex?: number | null;
  courseId?: string | null;
  courseTitle?: string | null;
}

export interface CourseDataResponse {
  courseId: string;
  courseTitle: string;
  dueDate?: string | null;
  totalLessons?: number | null;
  completedLessons?: number | null;
  pendingCount?: number | null;
}

export interface SofLIADataState {
  lessons: LessonData[];
  courses: CourseData[];
  totalPending: number;
  isLoading: boolean;
  isReady: boolean;
  error: string | null;
}
