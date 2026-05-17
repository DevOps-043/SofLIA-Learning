import type { ReportsAnalyticsAiSample } from '../../../types/reports-analytics.types'
import { redactSensitiveText } from './redact-sensitive-text'
import type { BuildContext } from './build-context'

export function pushAiSample(
  context: BuildContext,
  sample: {
    source: ReportsAnalyticsAiSample['source']
    userId: string
    courseId?: string
    courseTitle?: string | null
    text: string
    signals: ReportsAnalyticsAiSample['signals']
  },
): void {
  if (!sample.text || context.aiSamples.length >= 80) return
  const dimension = context.dimensions.find((item) => item.userId === sample.userId)
  if (!dimension) return

  context.aiSamples.push({
    source: sample.source,
    anonymousUserId: `user_${context.aiSamples.length + 1}`,
    courseId: sample.courseId,
    courseTitle: sample.courseTitle || undefined,
    segment: {
      ageBand: dimension.ageBand,
      gender: dimension.gender,
      jobTitle: dimension.jobTitle,
      regionName: dimension.regionName,
      zoneName: dimension.zoneName,
      teamName: dimension.teamName,
    },
    text: redactSensitiveText(sample.text).slice(0, 900),
    signals: sample.signals,
  })
}
