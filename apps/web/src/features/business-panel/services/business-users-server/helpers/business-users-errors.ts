import type { CreateUserErrorShape } from '../types'

export function mapCreateOrganizationUserError(error: unknown): Error | null {
  if (!error || typeof error !== 'object') return null

  const pgError = error as CreateUserErrorShape
  if (pgError.code !== '23505') return null

  const constraintHint = (
    pgError.constraint ||
    pgError.details ||
    pgError.message ||
    ''
  ).toLowerCase()

  if (constraintHint.includes('email')) {
    return new Error(
      'El correo electronico ya esta registrado en la plataforma. Este usuario existe en otra empresa.',
    )
  }

  if (constraintHint.includes('username')) {
    return new Error(
      'El nombre de usuario ya esta en uso. Por favor elige otro nombre de usuario.',
    )
  }

  return new Error(
    'Este usuario ya existe en la plataforma (correo o usuario duplicado). Por favor verifica los datos.',
  )
}
