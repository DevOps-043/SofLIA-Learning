import type { ReportsAnalyticsDataset } from '../../types/reports-analytics.types'

export function buildReportsAnalyticsAiPayload(dataset: ReportsAnalyticsDataset) {
  return {
    period: dataset.period,
    filters: dataset.filters,
    overview: dataset.overview,
    learning: {
      assignedCourses: dataset.learning.assignedCourses,
      completedCourses: dataset.learning.completedCourses,
      averageCompletionDays: dataset.learning.averageCompletionDays,
      medianCompletionDays: dataset.learning.medianCompletionDays,
      progressDistribution: dataset.learning.progressDistribution,
      completionsTrend: dataset.learning.completionsTrend,
    },
    activities: dataset.activities,
    quality: dataset.quality,
    soflia: dataset.soflia,
    notes: dataset.notes,
    planner: dataset.planner,
    courses: dataset.courses.slice(0, 20),
    dataQuality: dataset.dataQuality,
    connectionCalendar: dataset.connectionCalendar
      .filter((cell) => cell.value > 0)
      .sort((a, b) => b.value - a.value || a.date.localeCompare(b.date))
      .slice(0, 24),
    topSegments: {
      ageBands: dataset.segments.ageBands.slice(0, 10),
      gender: dataset.segments.gender.slice(0, 10),
      jobTitles: dataset.segments.jobTitles.slice(0, 10),
      roles: dataset.segments.roles.slice(0, 10),
    },
    rankings: {
      regions: dataset.rankings.regions.slice(0, 10),
      zones: dataset.rankings.zones.slice(0, 10),
      teams: dataset.rankings.teams.slice(0, 10),
      users: dataset.rankings.users.slice(0, 10).map((user, index) => ({
        anonymousUserId: `ranked_user_${index + 1}`,
        jobTitle: user.jobTitle,
        regionName: user.regionName,
        zoneName: user.zoneName,
        teamName: user.teamName,
        rankScore: user.rankScore,
        averageProgress: user.averageProgress,
        qualityScore: user.qualityScore,
      })),
    },
    anonymizedSamples: dataset.aiSamples.slice(0, 35),
  }
}

export function extractJsonObject(value: string): string {
  const trimmed = value.trim()
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) return trimmed

  const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (fencedMatch?.[1]) return fencedMatch[1].trim()

  const firstBrace = trimmed.indexOf('{')
  const lastBrace = trimmed.lastIndexOf('}')
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return trimmed.slice(firstBrace, lastBrace + 1)
  }

  return trimmed
}

export function resolveReportsAnalyticsGeminiModel(): string {
  return process.env.REPORTS_ANALYTICS_GEMINI_MODEL || process.env.GEMINI_MODEL || 'gemini-2.0-flash'
}

export async function withReportsAnalyticsAiTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined

  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(new Error(`Reports analytics Gemini request exceeded ${String(timeoutMs)}ms`))
        }, timeoutMs)
      }),
    ])
  } finally {
    if (timeoutId) clearTimeout(timeoutId)
  }
}
