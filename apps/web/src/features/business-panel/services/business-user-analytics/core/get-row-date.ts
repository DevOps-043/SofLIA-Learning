import { isRecord } from './is-record'
import { stringOrNull } from './string-or-null'

export function getRowDate(row: unknown): string | null {
  if (!isRecord(row)) return null
  return stringOrNull(row.completed_at) || stringOrNull(row.created_at) || stringOrNull(row.updated_at)
}
