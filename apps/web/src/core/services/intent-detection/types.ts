export type Intent =
  | 'create_prompt'
  | 'nanobana'
  | 'navigate'
  | 'question'
  | 'feedback'
  | 'general'

export type NanobananaDomain = 'ui' | 'photo' | 'diagram'
export type OutputFormat = 'wireframe' | 'mockup' | 'render' | 'diagram'

export interface IntentResult {
  intent: Intent
  confidence: number
  entities?: {
    promptTopic?: string
    targetPage?: string
    category?: string
    nanobananaDomain?: NanobananaDomain
    outputFormat?: OutputFormat
  }
}
