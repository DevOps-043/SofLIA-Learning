import { fetchUserStudyStreakRow } from './db'

export interface UserStudyStats {
  totalStudyMinutes: number
  totalSessionsCompleted: number
  averageSessionMinutes: number
  currentStreak: number
  longestStreak: number
}

export async function getUserStudyStats(userId: string): Promise<UserStudyStats> {
  const streakRow = await fetchUserStudyStreakRow(userId)

  if (!streakRow) {
    return {
      totalStudyMinutes: 0,
      totalSessionsCompleted: 0,
      averageSessionMinutes: 0,
      currentStreak: 0,
      longestStreak: 0,
    }
  }

  const totalSessionsCompleted = streakRow.total_sessions_completed || 0
  const totalStudyMinutes = streakRow.total_study_minutes || 0

  return {
    totalStudyMinutes,
    totalSessionsCompleted,
    averageSessionMinutes:
      totalSessionsCompleted > 0
        ? totalStudyMinutes / totalSessionsCompleted
        : 0,
    currentStreak: streakRow.current_streak || 0,
    longestStreak: streakRow.longest_streak || 0,
  }
}
