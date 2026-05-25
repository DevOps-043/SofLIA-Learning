import { isDangerousKey, isMergeableRecord } from './guards'
import type { SafeMergeRecord } from './types'

export function sanitizeObject<T extends SafeMergeRecord>(obj: T): Partial<T> {
  if (!isMergeableRecord(obj)) {
    return obj
  }

  const sanitized: Partial<T> = {}

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key) && !isDangerousKey(key)) {
      const value = obj[key]

      sanitized[key as keyof T] = isMergeableRecord(value)
        ? sanitizeObject(value) as T[keyof T]
        : value as T[keyof T]
    }
  }

  return sanitized
}

export function createSafeObject<T extends SafeMergeRecord>(obj: T): T {
  const safe: SafeMergeRecord = Object.create(null)
  const sanitized = sanitizeObject(obj)

  for (const key in sanitized) {
    if (Object.prototype.hasOwnProperty.call(sanitized, key)) {
      safe[key] = sanitized[key]
    }
  }

  return safe as T
}
