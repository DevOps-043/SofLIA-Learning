import { countryCodeToAlpha3 } from './constants'
import type { CountMap, DateActivityMap, LookupRow } from './shared-types'

export function incrementCounter(bucket: CountMap, key: string, amount = 1) {
  bucket[key] = (bucket[key] || 0) + amount
}

export function mapCountryCode(countryCode: string) {
  const upperCode = countryCode.toUpperCase()
  return countryCodeToAlpha3[upperCode] || upperCode
}

export function buildNameMap(items?: LookupRow[] | null) {
  return new Map((items ?? []).map((item) => [item.id, item.nombre]))
}

export function incrementLookupCounter(
  bucket: CountMap,
  id: string | null,
  lookup: Map<string, string>,
  fallback: string,
) {
  if (!id) return
  incrementCounter(bucket, lookup.get(id) || fallback)
}

export function incrementDateActivity(
  bucket: DateActivityMap,
  dayKey: string,
  field: 'posts' | 'comments',
) {
  const current = bucket[dayKey] ?? { posts: 0, comments: 0 }
  current[field] += 1
  bucket[dayKey] = current
}

export function groupBy<T>(items: T[], getKey: (item: T) => string) {
  const grouped = new Map<string, T[]>()
  items.forEach((item) => {
    const key = getKey(item)
    const current = grouped.get(key)
    if (current) current.push(item)
    else grouped.set(key, [item])
  })
  return grouped
}
