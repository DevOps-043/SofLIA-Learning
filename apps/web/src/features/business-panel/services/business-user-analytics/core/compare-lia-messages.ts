import { LiaMessageRecord } from './lia-message-record'

export function compareLiaMessages(a: LiaMessageRecord, b: LiaMessageRecord): number {
  const sequenceDiff = Number(a.message_sequence || 0) - Number(b.message_sequence || 0)
  if (sequenceDiff !== 0) return sequenceDiff
  return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime()
}
