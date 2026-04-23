import { LiaMetrics, StudentCourseProgressData, StudentEnrollment, StudySessionMetrics } from './types'

const MS_PER_DAY = 1000 * 60 * 60 * 24

function resolveEnrollmentDays(enrolledAt: string | null | undefined): number {
  if (!enrolledAt) return 1
  const days = Math.ceil((Date.now() - new Date(enrolledAt).getTime()) / MS_PER_DAY)
  return Math.max(1, days)
}

export function buildStudentDetailsResponse(
  enrollment: StudentEnrollment,
  liaMetrics: LiaMetrics,
  studySessionMetrics: StudySessionMetrics,
  progressData: StudentCourseProgressData,
) {
  const totalStudyHours = Number(studySessionMetrics.totalStudyTime || 0)
  const totalSessions = Number(studySessionMetrics.totalSessions || 0)
  const progressPercentage = enrollment.overall_progress_percentage || enrollment.progress_percentage || 0
  const totalLessonsViewed = progressData.lessonProgress.length
  const completedLessons = progressData.lessonProgress.filter((lesson) => lesson.completed_at).length
  const enrollmentDays = resolveEnrollmentDays(enrollment.enrolled_at)

  return {
    student: enrollment.users || null,
    enrollment: {
      status: enrollment.enrollment_status || 'active',
      enrolledAt: enrollment.enrolled_at || null,
      lastAccessedAt: enrollment.last_accessed_at || null,
      progressPercentage,
    },
    lia: liaMetrics,
    studySessions: studySessionMetrics,
    engagement: {
      totalSessions,
      avgDailyTime: totalSessions > 0 ? (totalStudyHours / enrollmentDays).toFixed(1) : 0,
      lessonsViewed: totalLessonsViewed,
      lessonsCompleted: completedLessons,
      notesCreated: progressData.userNotes.length,
      activitiesCompleted: progressData.completedActivities.length,
      progressPercentage: Math.round(progressPercentage),
    },
    moduleProgress: progressData.moduleProgress,
  }
}
