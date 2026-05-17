import { isDangerousKey, isMergeableRecord } from './guards'
import type { SafeMergeRecord } from './types'

export function isObjectSafe(obj: SafeMergeRecord): boolean {
  if (!isMergeableRecord(obj)) {
    return true
  }

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      if (isDangerousKey(key)) {
        return false
      }

      const value = obj[key]
      if (isMergeableRecord(value) && !isObjectSafe(value)) {
        return false
      }
    }
  }

  return true
}

export function validateObject(obj: SafeMergeRecord, context?: string): void {
  if (!isObjectSafe(obj)) {
    const contextMsg = context ? ` (${context})` : ''
    throw new Error(`Objeto contiene keys peligrosas que pueden causar Prototype Pollution${contextMsg}`)
  }
}
