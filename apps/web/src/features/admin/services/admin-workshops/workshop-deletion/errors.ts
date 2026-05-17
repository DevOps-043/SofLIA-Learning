import type { LooseQueryError } from './types'

const RELATION_NOT_FOUND_CODE = '42P01'
const SCHEMA_CACHE_RELATION_NOT_FOUND_CODE = 'PGRST205'
const FOREIGN_KEY_VIOLATION_CODE = '23503'

export class WorkshopDeletionError extends Error {
  readonly statusCode: number

  constructor(message: string, statusCode = 500, options?: { cause?: unknown }) {
    super(message, options)
    this.name = 'WorkshopDeletionError'
    this.statusCode = statusCode
  }
}

export function buildDeletionError(message: string, error: LooseQueryError): Error {
  const formattedMessage =
    error.message?.trim().length > 0 ? `${message}: ${error.message}` : message

  if (error.code === FOREIGN_KEY_VIOLATION_CODE) {
    return new WorkshopDeletionError(formattedMessage, 409, { cause: error })
  }

  return new WorkshopDeletionError(formattedMessage, 500, { cause: error })
}

export function isMissingRelationError(error: LooseQueryError): boolean {
  const normalizedMessage = (error.message || '').toLowerCase()

  return (
    error.code === RELATION_NOT_FOUND_CODE ||
    error.code === SCHEMA_CACHE_RELATION_NOT_FOUND_CODE ||
    normalizedMessage.includes('could not find the table') ||
    (normalizedMessage.includes('relation') && normalizedMessage.includes('does not exist')) ||
    normalizedMessage.includes('schema cache')
  )
}
