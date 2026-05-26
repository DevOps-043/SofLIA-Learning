export type AuthAccountProvisioningErrorCode =
  | 'DUPLICATE_EMAIL'
  | 'DUPLICATE_USERNAME'
  | 'AUTH_CREATE_FAILED'
  | 'PROFILE_CREATE_FAILED'

export class AuthAccountProvisioningError extends Error {
  constructor(
    readonly code: AuthAccountProvisioningErrorCode,
    message: string,
  ) {
    super(message)
    this.name = 'AuthAccountProvisioningError'
  }
}

export function mapProvisioningError(error: unknown) {
  if (error instanceof AuthAccountProvisioningError) {
    if (error.code === 'DUPLICATE_EMAIL') return 'El email ya existe'
    if (error.code === 'DUPLICATE_USERNAME') return 'El usuario ya existe'
    if (error.code === 'PROFILE_CREATE_FAILED') {
      return 'Error al crear perfil de usuario'
    }
    return 'Error al crear usuario de autenticacion'
  }

  return 'Error inesperado al crear la cuenta'
}

export function serializeProvisioningCause(
  error: unknown,
): { code: string | null; message: string | null; status: number | null } {
  if (!error || typeof error !== 'object') {
    return { code: null, message: String(error), status: null }
  }

  const candidate = error as {
    code?: unknown
    message?: unknown
    status?: unknown
  }

  return {
    code: typeof candidate.code === 'string' ? candidate.code : null,
    message: typeof candidate.message === 'string' ? candidate.message : null,
    status: typeof candidate.status === 'number' ? candidate.status : null,
  }
}
