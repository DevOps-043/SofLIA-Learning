export interface ModuleInfo {
  moduleId: string;
  moduleTitle: string;
  moduleDescription?: string;
  moduleOrderIndex: number;
  lessons: LessonInfo[];
}

export interface LessonInfo {
  lessonId: string;
  lessonTitle: string;
  lessonDescription?: string;
  lessonOrderIndex: number;
  durationSeconds?: number;
  totalDurationMinutes?: number;
}

export interface CourseLessonContext {
  contextType?: 'course' | 'workshop';
  courseId?: string;
  courseSlug?: string;
  courseTitle?: string;
  courseDescription?: string;
  moduleId?: string;
  moduleTitle?: string;
  lessonId?: string;
  lessonTitle?: string;
  lessonDescription?: string;
  transcriptContent?: string;
  summaryContent?: string;
  videoTime?: number;
  durationSeconds?: number;
  totalDurationMinutes?: number;
  allModules?: ModuleInfo[];
  userRole?: string;
  difficultyDetected?: {
    patterns: Array<{
      type: string;
      severity: 'low' | 'medium' | 'high';
      description: string;
    }>;
    overallScore: number;
    shouldIntervene: boolean;
    suggestedHelpType?: string;
  };
  activitiesContext?: CourseActivitiesContext;
  userBehaviorContext?: string;
  learningProgressContext?: CourseLearningProgressContext;
}

export interface CourseActivitiesContext {
  totalActivities: number;
  requiredActivities: number;
  completedActivities: number;
  pendingRequiredCount: number;
  pendingRequiredTitles?: string;
  activityTypes?: Array<{
    title: string;
    type: string;
    isRequired: boolean;
    isCompleted: boolean;
  }>;
  currentActivityFocus?: {
    title: string;
    type: string;
    isRequired: boolean;
    description: string;
  } | null;
}

export interface CourseLearningProgressContext {
  currentLessonNumber: number;
  totalLessons: number;
  progressPercentage: number;
  currentTab: string;
  timeInCurrentLesson: string;
}
