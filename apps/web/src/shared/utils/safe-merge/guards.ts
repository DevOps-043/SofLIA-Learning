import { DANGEROUS_KEYS } from './constants'
import type { SafeMergeRecord } from './types'

export function isMergeableRecord(value: unknown): value is SafeMergeRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function isDangerousKey(key: string): boolean {
  return (DANGEROUS_KEYS as readonly string[]).includes(key)
}
