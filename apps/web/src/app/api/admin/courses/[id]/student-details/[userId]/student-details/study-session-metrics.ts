import { LessonProgressRow, StudySessionRow } from './types'
import { calculateActiveDays, calculatePreferredTimeSlots } from './study-distributions'
import { calculateDailyStudyTime, calculateStudyStreak, calculateWeeklyFrequency, calculateWeeklyProgress } from './study-trends'

export function buildStudySessionMetrics(
  studySessions: StudySessionRow[],
  courseId: string,
  lessonIds: string[],
  lessonProgress: LessonProgressRow[],
) {
  const courseSessions = studySessions.filter(
    (session) => session.course_id === courseId || (session.lesson_id ? lessonIds.includes(session.lesson_id) : false),
  )
  const totalSessions = courseSessions.length
  const totalStudyMinutes = courseSessions.reduce((total, session) => total + getSessionMinutes(session), 0)
  const lastSession = courseSessions[0]
  const weeklyFrequency = calculateWeeklyFrequency(studySessions)
  const totalCourseStudyTime = lessonProgress.reduce((total, lesson) => total + (lesson.time_spent_minutes || 0), 0)

  return {
    totalSessions,
    lastSession: lastSession
      ? {
          startTime: lastSession.start_time,
          endTime: lastSession.end_time,
          duration: lastSession.duration_minutes,
          hoursAgo: Math.round((Date.now() - new Date(lastSession.start_time).getTime()) / (1000 * 60 * 60)),
        }
      : null,
    avgSessionDuration: totalSessions > 0 ? Math.round(totalStudyMinutes / totalSessions) : 0,
    totalStudyTime: Math.round(totalStudyMinutes / 60),
    totalCourseStudyTime: Math.round(totalCourseStudyTime / 60),
    weeklyFrequency: weeklyFrequency.toFixed(1),
    preferredTimeSlots: calculatePreferredTimeSlots(studySessions),
    activeDays: calculateActiveDays(studySessions),
    weeklyProgress: calculateWeeklyProgress(studySessions, 7),
    dailyStudyTime: calculateDailyStudyTime(studySessions, 7),
    studyStreak: calculateStudyStreak(studySessions),
  }
}

function getSessionMinutes(session: StudySessionRow) {
  if (session.duration_minutes) return session.duration_minutes
  if (!session.end_time || !session.start_time) return 0
  return (new Date(session.end_time).getTime() - new Date(session.start_time).getTime()) / 1000 / 60
}
