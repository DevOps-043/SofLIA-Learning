import { DEFAULT_READING_SPEED, READING_SPEEDS } from './config'
import { countWords } from './count'
import { formatReadingTime } from './format'
import type { ReadingSpeed, ReadingTimeDetails } from './types'

export function calculateReadingTimeMinutes(
  text: string,
  speed: ReadingSpeed = DEFAULT_READING_SPEED,
): number {
  const wordCount = countWords(text)

  if (wordCount === 0) {
    return 1
  }

  const rawMinutes = wordCount / READING_SPEEDS[speed].wordsPerMinute
  return Math.max(1, Math.round(rawMinutes))
}

export function calculateReadingTimeDetailed(
  text: string,
  speed: ReadingSpeed = DEFAULT_READING_SPEED,
): ReadingTimeDetails {
  const wordCount = countWords(text)
  const speedConfig = READING_SPEEDS[speed]

  if (wordCount === 0) {
    return {
      wordCount: 0,
      estimatedMinutes: 1,
      exactMinutes: 0,
      formattedTime: '~1 min',
      speedUsed: speedConfig,
    }
  }

  const exactMinutes = wordCount / speedConfig.wordsPerMinute
  const estimatedMinutes = Math.max(1, Math.round(exactMinutes))

  return {
    wordCount,
    estimatedMinutes,
    exactMinutes: Math.round(exactMinutes * 100) / 100,
    formattedTime: formatReadingTime(estimatedMinutes),
    speedUsed: speedConfig,
  }
}

export function getReadingTimeInfo(text: string): ReadingTimeDetails {
  return calculateReadingTimeDetailed(text, DEFAULT_READING_SPEED)
}
