import { isDangerousKey, isMergeableRecord } from './guards'
import { sanitizeObject } from './sanitize'
import type { SafeMergeRecord } from './types'

export function safeMerge<T extends SafeMergeRecord>(
  target: T,
  ...sources: Array<SafeMergeRecord | null | undefined>
): T {
  const result = { ...target }

  for (const source of sources) {
    if (!isMergeableRecord(source)) {
      continue
    }

    const sanitizedSource = sanitizeObject(source)

    for (const key in sanitizedSource) {
      if (Object.prototype.hasOwnProperty.call(sanitizedSource, key)) {
        result[key as keyof T] = sanitizedSource[key] as T[keyof T]
      }
    }
  }

  return result
}

export function safeAssign<T extends SafeMergeRecord>(
  target: T,
  ...sources: Array<SafeMergeRecord | null | undefined>
): T {
  for (const source of sources) {
    if (!isMergeableRecord(source)) {
      continue
    }

    for (const key in source) {
      if (Object.prototype.hasOwnProperty.call(source, key) && !isDangerousKey(key)) {
        const value = source[key]

        target[key as keyof T] = isMergeableRecord(value)
          ? sanitizeObject(value) as T[keyof T]
          : value as T[keyof T]
      }
    }
  }

  return target
}
