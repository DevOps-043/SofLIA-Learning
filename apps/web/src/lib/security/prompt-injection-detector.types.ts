export type PromptRiskAction = 'allow' | 'guard' | 'block'

export interface PromptRiskAssessment {
  score: number
  action: PromptRiskAction
  categories: string[]
  reasons: string[]
}

export interface DetectionRule {
  category: string
  weight: number
  reason: string
  patterns: RegExp[]
}
