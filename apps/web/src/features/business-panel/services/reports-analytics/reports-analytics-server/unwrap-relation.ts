import type { Relation } from './relation'

export function unwrapRelation<T>(relation: Relation<T> | undefined): T | null {
  if (!relation) return null
  if (Array.isArray(relation)) return relation[0] || null
  return relation
}
