import type { BusinessUserAnalyticsAiSample } from '../../../types/business-user-analytics.types'
import { redactSensitiveText } from './redact-sensitive-text'

export function pushSample(samples: BusinessUserAnalyticsAiSample[], sample: BusinessUserAnalyticsAiSample): void {
  if (!sample.text.trim()) return

  samples.push({
    ...sample,
    text: redactSensitiveText(sample.text).slice(0, 900),
  })
}
