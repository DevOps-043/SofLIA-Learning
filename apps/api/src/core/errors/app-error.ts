import { ZodError } from 'zod'

export interface ValidationIssue {
  message: string
  path: string
}

export class AppError extends Error {
  constructor(
    message: string,
    public readonly statusCode = 500,
    public readonly code = 'INTERNAL_ERROR',
    public readonly details?: unknown,
  ) {
    super(message)
    this.name = this.constructor.name
    Error.captureStackTrace(this, this.constructor)
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'No autenticado', code = 'UNAUTHENTICATED') {
    super(message, 401, code)
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'No tienes permisos para acceder a este recurso') {
    super(message, 403, 'INSUFFICIENT_PERMISSIONS')
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Recurso no encontrado', code = 'NOT_FOUND') {
    super(message, 404, code)
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Datos de entrada invalidos', details?: ValidationIssue[]) {
    super(message, 400, 'VALIDATION_ERROR', details)
  }
}

export class DatabaseError extends AppError {
  constructor(message = 'Error interno de persistencia', details?: unknown) {
    super(message, 500, 'DATABASE_ERROR', details)
  }
}

export function createError(
  message: string,
  statusCode: number,
  code: string,
  details?: unknown,
) {
  return new AppError(message, statusCode, code, details)
}

export function fromZodError(error: ZodError) {
  const details: ValidationIssue[] = error.issues.map((issue) => ({
    message: issue.message,
    path: issue.path.join('.') || 'root',
  }))

  return new ValidationError('Datos de entrada invalidos', details)
}

export function isJsonSyntaxError(
  error: unknown,
): error is SyntaxError & { body: string } {
  return error instanceof SyntaxError && 'body' in error
}
