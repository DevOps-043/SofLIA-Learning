import { StudySessionRow } from './types'

const SHORT_DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab']

export function calculateWeeklyFrequency(sessions: StudySessionRow[]) {
  if (sessions.length === 0) return 0
  const uniqueDays = new Set(sessions.map((session) => new Date(session.start_time).toDateString()))
  const oldestSession = new Date(sessions[sessions.length - 1].start_time)
  const newestSession = new Date(sessions[0].start_time)
  const weeks = Math.max(1, (newestSession.getTime() - oldestSession.getTime()) / (1000 * 60 * 60 * 24 * 7))
  return uniqueDays.size / weeks
}

export function calculateWeeklyProgress(sessions: StudySessionRow[], days: number) {
  return buildDailySeries(days, (date) => ({
    dia: SHORT_DAY_NAMES[date.getDay()],
    progreso: Math.round(sumForDate(sessions, date, (session) => session.progress_made || 0)),
  }))
}

export function calculateDailyStudyTime(sessions: StudySessionRow[], days: number) {
  return buildDailySeries(days, (date) => ({
    dia: SHORT_DAY_NAMES[date.getDay()],
    horas: parseFloat((sumForDate(sessions, date, getSessionMinutes) / 60).toFixed(1)),
  }))
}

export function calculateStudyStreak(sessions: StudySessionRow[]) {
  if (sessions.length === 0) return 0
  const sortedDates = Array.from(new Set(sessions.map((session) => new Date(session.start_time).toDateString()))).sort(
    (left, right) => new Date(right).getTime() - new Date(left).getTime(),
  )

  let streak = 0
  let currentDate = new Date()
  currentDate.setHours(0, 0, 0, 0)

  for (const dateString of sortedDates) {
    const date = new Date(dateString)
    date.setHours(0, 0, 0, 0)
    const diffDays = Math.floor((currentDate.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
    if (diffDays === streak || (streak === 0 && diffDays <= 1)) {
      streak += 1
      currentDate = date
      continue
    }
    break
  }

  return streak
}

function buildDailySeries<T>(days: number, buildPoint: (date: Date) => T) {
  const now = new Date()
  return Array.from({ length: days }, (_, index) => {
    const date = new Date(now)
    date.setDate(now.getDate() - (days - index - 1))
    return buildPoint(date)
  })
}

function sumForDate(sessions: StudySessionRow[], targetDate: Date, pickValue: (session: StudySessionRow) => number) {
  return sessions.reduce((total, session) => {
    const sessionDate = new Date(session.start_time)
    return sessionDate.toDateString() === targetDate.toDateString() ? total + pickValue(session) : total
  }, 0)
}

function getSessionMinutes(session: StudySessionRow) {
  if (session.duration_minutes) return session.duration_minutes
  if (!session.end_time || !session.start_time) return 0
  return (new Date(session.end_time).getTime() - new Date(session.start_time).getTime()) / 1000 / 60
}
