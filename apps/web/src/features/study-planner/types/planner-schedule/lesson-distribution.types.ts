export interface StudyPlannerScheduledLesson {
  courseId?: string
  courseTitle: string
  lessonId?: string
  lessonTitle: string
  lessonOrderIndex: number
  durationMinutes: number
  moduleTitle?: string
  moduleOrderIndex?: number
}

export interface StudyPlannerStoredLessonDistribution {
  clientReferenceId: string
  sessionId?: string
  dateStr: string
  dayName: string
  startTime: string
  endTime: string
  lessons: StudyPlannerScheduledLesson[]
}

export interface StudyPlannerDistributionSlotSnapshot {
  dateStr: string
  dayName: string
  start: Date
  end: Date
}

export interface StudyPlannerComputedLessonDistribution {
  slot: StudyPlannerDistributionSlotSnapshot
  lessons: StudyPlannerScheduledLesson[]
}
