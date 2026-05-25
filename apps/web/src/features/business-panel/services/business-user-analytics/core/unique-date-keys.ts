import { toUtcDateKey } from './to-utc-date-key'

export function uniqueDateKeys(values: string[]): string[] {
  return Array.from(new Set(values.map(toUtcDateKey).filter((key): key is string => Boolean(key)))).sort()
}
