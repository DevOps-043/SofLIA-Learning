import { AppError } from '@/core/errors/app-error'

export class ConflictError extends AppError {
  constructor(message = 'Conflicto de negocio detectado') {
    super(message, 409, 'CONFLICT')
  }
}
