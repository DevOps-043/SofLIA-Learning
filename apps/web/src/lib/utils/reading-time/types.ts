export type ReadingSpeed = 'slow' | 'average' | 'fast'

export interface ReadingSpeedConfig {
  wordsPerMinute: number
  label: string
  description: string
}

export interface ReadingTimeDetails {
  wordCount: number
  estimatedMinutes: number
  exactMinutes: number
  formattedTime: string
  speedUsed: ReadingSpeedConfig
}
