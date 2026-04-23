import type { DifficultyAnalysis } from '@/lib/rrweb/difficulty-pattern-detector'
import type { SessionContext } from '@/lib/rrweb/session-analyzer'
import { createDefaultResponse } from './default-response'
import { createErroneousClicksResponse } from './erroneous-clicks-response'
import { createExcessiveScrollResponse } from './excessive-scroll-response'
import { createFailedAttemptsResponse } from './failed-attempts-response'
import { createFrequentDeletionResponse } from './frequent-deletion-response'
import { createInactivityResponse } from './inactivity-response'
import { createRepetitiveCyclesResponse } from './repetitive-cycles-response'
import type { ProactiveHelpResponse } from '../types'

export function generateMockProactiveResponse(
  analysis: DifficultyAnalysis,
  sessionContext: SessionContext | null,
): ProactiveHelpResponse {
  const primaryPattern = analysis.patterns[0]
  const responses: Record<string, ProactiveHelpResponse> = {
    inactivity: createInactivityResponse(),
    failed_attempts: createFailedAttemptsResponse(sessionContext),
    excessive_scroll: createExcessiveScrollResponse(),
    frequent_deletion: createFrequentDeletionResponse(),
    repetitive_cycles: createRepetitiveCyclesResponse(),
    erroneous_clicks: createErroneousClicksResponse(),
  }

  return responses[primaryPattern?.type] || createDefaultResponse()
}
