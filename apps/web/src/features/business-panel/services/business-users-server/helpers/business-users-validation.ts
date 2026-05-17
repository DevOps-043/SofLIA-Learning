import {
  UserDemographicsSchema,
} from '../../../../../lib/schemas/user-demographics.schema'
import type { CreateBusinessUserRequest, UpdateBusinessUserRequest } from '../../businessUsers.service'

function assertNonEmptyValue(value: string | undefined, message: string): string {
  if (!value || !value.trim()) throw new Error(message)
  return value.trim()
}

export function assertValidBusinessUserDemographics(
  userData: Pick<CreateBusinessUserRequest | UpdateBusinessUserRequest, 'date_of_birth' | 'gender'>,
) {
  const result = UserDemographicsSchema.safeParse({
    date_of_birth: userData.date_of_birth,
    gender: userData.gender,
  })

  if (!result.success) {
    throw new Error(result.error.errors[0]?.message || 'Datos demograficos invalidos')
  }
}

export function validateCreateBusinessUserRequest(
  userData: CreateBusinessUserRequest,
) {
  const password = assertNonEmptyValue(userData.password, 'La contrasena es obligatoria')

  if (password.length < 6) {
    throw new Error('La contrasena debe tener al menos 6 caracteres')
  }

  assertNonEmptyValue(userData.job_title, 'El cargo/puesto es obligatorio')
  assertValidBusinessUserDemographics(userData)
}
