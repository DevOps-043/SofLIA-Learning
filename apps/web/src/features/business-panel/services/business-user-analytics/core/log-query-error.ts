import { logger } from '@/lib/utils/logger'

export function logQueryError(label: string, error: unknown): void {
  if (!error) return
  logger.error(`Business user analytics query failed: ${label}`, error)
}
