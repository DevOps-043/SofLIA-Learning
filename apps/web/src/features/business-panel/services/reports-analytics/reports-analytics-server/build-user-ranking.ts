import type { ReportsAnalyticsUserDetailRow, ReportsAnalyticsUserRankingRow } from '../../../types/reports-analytics.types'
import { calculatePercentage, calculateRankScore } from '../reports-analytics.helpers'

export function buildUserRanking(userDetails: ReportsAnalyticsUserDetailRow[]): ReportsAnalyticsUserRankingRow[] {
  return userDetails
    .map((user) => {
      const completionRate = calculatePercentage(user.coursesCompleted, user.coursesAssigned)
      const rankScore = calculateRankScore({
        averageProgress: user.averageProgress,
        completionRate,
        qualityScore: user.qualityScore,
        sofliaAdoptionRate: user.sofliaConversations > 0 ? 100 : 0,
        notesAdoptionRate: user.notesCreated > 0 ? 100 : 0,
        overdueAssignments: user.overdueAssignments,
        users: 1,
      })

      return {
        userId: user.userId,
        displayName: user.displayName,
        email: user.email,
        jobTitle: user.jobTitle,
        regionName: user.regionName,
        zoneName: user.zoneName,
        teamName: user.teamName,
        averageProgress: user.averageProgress,
        completionRate,
        averageCompletionDays: user.averageCompletionDays,
        sofliaConversations: user.sofliaConversations,
        notesCreated: user.notesCreated,
        quizAverageScore: user.quizAverageScore,
        qualityScore: user.qualityScore,
        overdueAssignments: user.overdueAssignments,
        rankScore,
      }
    })
    .sort((a, b) => b.rankScore - a.rankScore || a.displayName.localeCompare(b.displayName))
}
