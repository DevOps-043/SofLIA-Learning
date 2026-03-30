/**
 * API Error Handling Utilities
 *
 * Provides safe error formatting for API responses that prevents
 * exposing sensitive stack traces and internal system details in production.
 *
 * @module api-errors
 */

/**
 * Standard API error response format
 */
export interface ApiErrorResponse {
  success: false
  error: string
  code?: string
  details?: unknown
  timestamp?: string
}

/**
 * Formats an error for API response, hiding sensitive details in production
 *
 * @param error - The error to format (can be Error, string, or unknown)
 * @param userMessage - Optional user-friendly message to show
 * @returns Formatted error object safe for API responses
 *
 * @example
 * ```typescript
 * try {
 *   await someOperation()
 * } catch (error) {
 *   return NextResponse.json(
 *     formatApiError(error, 'Failed to create resource'),
 *     { status: 500 }
 *   )
 * }
 * ```
 */
export function formatApiError(
  error: unknown,
  userMessage?: string
): ApiErrorResponse {
  const isDevelopment = process.env.NODE_ENV === 'development'
  const timestamp = new Date().toISOString()

  // Base error response
  const response: ApiErrorResponse = {
    success: false,
    error: userMessage || 'An error occurred',
    timestamp
  }

  // Handle Error instances
  if (error instanceof Error) {
    // In production: only show the user message
    // In development: include error message and stack trace
    response.error = userMessage || error.message

    if (isDevelopment) {
      response.details = {
        message: error.message,
        stack: error.stack,
        name: error.name
      }
    }
  }
  // Handle string errors
  else if (typeof error === 'string') {
    response.error = userMessage || error

    if (isDevelopment) {
      response.details = { originalError: error }
    }
  }
  // Handle unknown errors
  else {
    response.error = userMessage || 'An unexpected error occurred'

    if (isDevelopment) {
      response.details = {
        type: typeof error,
        value: error
      }
    }
  }

  return response
}

/**
 * Creates a formatted error response for database/Supabase errors
 *
 * @param error - The database error
 * @param operation - Description of the operation that failed
 * @returns Formatted error object
 *
 * @example
 * ```typescript
 * const { error } = await supabase.from('users').insert(data)
 * if (error) {
 *   return NextResponse.json(
 *     formatDatabaseError(error, 'create user'),
 *     { status: 500 }
 *   )
 * }
 * ```
 */
export function formatDatabaseError(
  error: any,
  operation: string
): ApiErrorResponse {
  const isDevelopment = process.env.NODE_ENV === 'development'

  // Extract Supabase/PostgreSQL error details
  const code = error?.code || 'DATABASE_ERROR'
  const message = error?.message || 'Database operation failed'
  const hint = error?.hint
  const details = error?.details

  const response: ApiErrorResponse = {
    success: false,
    error: `Failed to ${operation}`,
    code,
    timestamp: new Date().toISOString()
  }

  // In development, include detailed database error info
  if (isDevelopment) {
    response.details = {
      message,
      code,
      hint,
      details,
      ...(error?.stack && { stack: error.stack })
    }
  }

  return response
}

/**
 * Creates a formatted error response for validation errors
 *
 * @param validationErrors - Array or object of validation errors
 * @param message - Optional custom message
 * @returns Formatted error object
 *
 * @example
 * ```typescript
 * const result = schema.safeParse(data)
 * if (!result.success) {
 *   return NextResponse.json(
 *     formatValidationError(result.error.errors),
 *     { status: 400 }
 *   )
 * }
 * ```
 */
export function formatValidationError(
  validationErrors: unknown,
  message: string = 'Validation failed'
): ApiErrorResponse {
  return {
    success: false,
    error: message,
    code: 'VALIDATION_ERROR',
    details: validationErrors,
    timestamp: new Date().toISOString()
  }
}

/**
 * Logs error details to console with proper formatting
 * (Only logs stack traces in development)
 *
 * @param context - Context where the error occurred (e.g., function name)
 * @param error - The error to log
 *
 * @example
 * ```typescript
 * catch (error) {
 *   logError('AdminCommunitiesService.createCommunity', error)
 *   return NextResponse.json(formatApiError(error), { status: 500 })
 * }
 * ```
 */
export function logError(context: string, error: unknown): void {
  const isDevelopment = process.env.NODE_ENV === 'development'

  if (isDevelopment) {
  } else {
    // In production: log minimal info without stack traces
    if (error instanceof Error) {
    } else {
    }
  }
}

/**
 * Common error messages for consistency
 */
export const ERROR_MESSAGES = {
  // Generic
  INTERNAL_ERROR: 'An internal server error occurred',
  NOT_FOUND: 'Resource not found',
  UNAUTHORIZED: 'You are not authorized to perform this action',
  FORBIDDEN: 'Access forbidden',

  // Database
  DATABASE_ERROR: 'Database operation failed',
  DUPLICATE_ENTRY: 'A record with this information already exists',
  CONSTRAINT_VIOLATION: 'Operation violates data integrity constraints',

  // Validation
  INVALID_INPUT: 'Invalid input provided',
  MISSING_REQUIRED_FIELD: 'Required field is missing',
  INVALID_FORMAT: 'Invalid data format',

  // Operations
  CREATE_FAILED: 'Failed to create resource',
  UPDATE_FAILED: 'Failed to update resource',
  DELETE_FAILED: 'Failed to delete resource',
  FETCH_FAILED: 'Failed to fetch data',
} as const
