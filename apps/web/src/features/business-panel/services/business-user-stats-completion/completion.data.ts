import type {
  BusinessUserStatsActivityCompletionRecord,
  BusinessUserStatsAssignmentRecord,
  BusinessUserStatsCertificateRecord,
  BusinessUserStatsCourseModuleRecord,
  BusinessUserStatsEnrollmentRecord,
  BusinessUserStatsInstructorRecord,
  BusinessUserStatsLessonActivityCatalogRecord,
  BusinessUserStatsLessonCountRecord,
  BusinessUserStatsLessonNoteRecord,
  BusinessUserStatsLessonProgressRecord,
  BusinessUserStatsLessonRecord,
} from './completion.records'

export interface BaseCompletionQueryData {
  enrollments: BusinessUserStatsEnrollmentRecord[]
  lessonProgress: BusinessUserStatsLessonProgressRecord[]
  activityCompletions: BusinessUserStatsActivityCompletionRecord[]
  lessonNotes: BusinessUserStatsLessonNoteRecord[]
  certificates: BusinessUserStatsCertificateRecord[]
  assignments: BusinessUserStatsAssignmentRecord[]
}

export interface DerivedCompletionQueryData {
  lessons: BusinessUserStatsLessonRecord[]
  courseModules: BusinessUserStatsCourseModuleRecord[]
  lessonCounts: BusinessUserStatsLessonCountRecord[]
  lessonActivities: BusinessUserStatsLessonActivityCatalogRecord[]
  instructors: BusinessUserStatsInstructorRecord[]
}

export interface CompletionQueryData
  extends BaseCompletionQueryData,
    DerivedCompletionQueryData {}
