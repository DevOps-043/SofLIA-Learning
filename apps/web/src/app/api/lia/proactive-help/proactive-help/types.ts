import type { eventWithTime } from '@rrweb/types'
import type { DifficultyAnalysis } from '@/lib/rrweb/difficulty-pattern-detector'

export type ProactiveResource = NonNullable<ProactiveHelpResponse['resources']>[number]

export interface ProactiveHelpRequest {
  analysis: DifficultyAnalysis
  sessionEvents: eventWithTime[]
  workshopId?: string
  activityId?: string
  userId?: string
}

export interface ProactiveHelpResponse {
  success: boolean
  response: string
  suggestions: string[]
  resources?: Array<{
    title: string
    description: string
    url?: string
  }>
  nextSteps?: string[]
}
