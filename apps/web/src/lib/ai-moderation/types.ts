export interface AIModerationResult {
  isInappropriate: boolean
  confidence: number
  categories: string[]
  reasoning: string
  requiresHumanReview: boolean
  processingTimeMs: number
}

export interface AIModerationContext {
  contentType: 'post' | 'comment'
  userId: string
  previousWarnings?: number
}

export interface ModerationCategory {
  hate: boolean
  'hate/threatening': boolean
  harassment: boolean
  'harassment/threatening': boolean
  'self-harm': boolean
  'self-harm/intent': boolean
  'self-harm/instructions': boolean
  sexual: boolean
  'sexual/minors': boolean
  violence: boolean
  'violence/graphic': boolean
}
