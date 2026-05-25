import { createHash } from 'crypto'

export function hashAnalyticsPayload(value: unknown): string {
  return createHash('sha256')
    .update(JSON.stringify(value))
    .digest('hex')
}
