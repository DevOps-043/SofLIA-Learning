export type SanitizerConfig = {
  ALLOWED_TAGS?: string[]
} & Record<string, unknown>

export type SanitizationLevel = 'strict' | 'basic' | 'rich' | 'full'

export interface SanitizeOptions {
  level?: SanitizationLevel
  customConfig?: Record<string, unknown>
  maxLength?: number
}
