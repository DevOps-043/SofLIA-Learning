export interface StudyPlannerLessonContext {
  lessonId: string;
  lessonTitle: string;
  lessonOrderIndex: number;
  durationMinutes: number;
  isCompleted: boolean;
}

export interface StudyPlannerModuleContext {
  moduleId: string;
  moduleTitle: string;
  moduleOrderIndex: number;
  lessons: StudyPlannerLessonContext[];
}

export interface StudyPlannerCourseContext {
  id: string;
  title: string;
  category: string;
  level: string;
  durationMinutes: number;
  completionPercentage: number;
  dueDate?: string;
  assignedBy?: string;
  modules?: StudyPlannerModuleContext[];
}

export interface StudyPlannerCourseAnalysis {
  totalMinutes: number;
  totalLessons: number;
  averageComplexity: number;
  minimumLessonTime: number;
  averageLessonDuration: number;
  maxLessonDuration: number;
  minLessonDuration: number;
  courseType: 'practical' | 'theoretical' | 'mixed';
  suggestedSessionDurations: {
    short: number;
    normal: number;
    long: number;
    reasoning: string;
  };
}
