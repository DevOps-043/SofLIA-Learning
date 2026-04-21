export type StudyPlannerCoverageStatus = 'covered' | 'partial' | 'empty' | 'no_lessons';

export interface StudyPlannerCoverageLesson {
  courseId: string;
  isCompleted: boolean;
  isPlanned: boolean;
  lessonId: string;
  lessonOrderIndex: number;
  lessonTitle: string;
  moduleId: string;
  moduleOrderIndex: number;
  moduleTitle: string;
  sessionIds: string[];
}

export interface StudyPlannerCourseCoverage {
  completedLessons: number;
  courseId: string;
  courseTitle: string;
  coverageStatus: StudyPlannerCoverageStatus;
  coveredBySessions: number;
  lessons: StudyPlannerCoverageLesson[];
  pendingLessons: number;
  plannedLessons: number;
  totalLessons: number;
  unplannedLessons: number;
}

export interface StudyPlannerCoverageResult {
  courses: StudyPlannerCourseCoverage[];
  plan: { id: string; name: string };
  totals: {
    completedLessons: number;
    coveredBySessions: number;
    pendingLessons: number;
    plannedLessons: number;
    totalLessons: number;
    unplannedLessons: number;
  };
}
