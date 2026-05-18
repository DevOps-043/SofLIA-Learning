import { z } from 'zod'

import { UserDemographicsSchema } from '@/lib/schemas/user-demographics.schema'
import type { ParsedImportUserRow } from './types'

const VALID_ORG_ROLES = ['owner', 'admin', 'member']
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export type ImportOrgRole = (typeof VALID_ORG_ROLES)[number]

export type ImportUserRowValidationResult =
  | {
      success: true
      orgRole: ImportOrgRole
      password: string
      demographics: z.infer<typeof UserDemographicsSchema>
    }
  | {
      success: false
      error: string
    }

export function validateImportUserRow(
  userData: ParsedImportUserRow,
): ImportUserRowValidationResult {
  if (
    !userData.username ||
    !userData.email ||
    !userData.password ||
    !userData.password.trim()
  ) {
    return fail('Faltan campos requeridos (username, email o password)')
  }

  if (!userData.job_title || !userData.job_title.trim()) {
    return fail('El campo "job_title" (o cargo/puesto) es obligatorio')
  }

  if (!EMAIL_REGEX.test(userData.email)) {
    return fail('Email invalido')
  }

  const orgRole = (userData.org_role || 'member').toLowerCase()
  if (!VALID_ORG_ROLES.includes(orgRole)) {
    return fail(`Rol invalido. Debe ser: ${VALID_ORG_ROLES.join(', ')}`)
  }

  const demographicsResult = UserDemographicsSchema.safeParse({
    date_of_birth: userData.date_of_birth,
    gender: userData.gender,
  })

  if (!demographicsResult.success) {
    return fail(
      demographicsResult.error.errors[0]?.message ||
        'Datos demograficos invalidos',
    )
  }

  const password = userData.password.trim()
  if (password === '****************') {
    return fail(
      'La contrasena es un placeholder. Por favor ingrese una contrasena real.',
    )
  }

  if (password.length < 6) {
    return fail('La contrasena debe tener al menos 6 caracteres')
  }

  return {
    success: true as const,
    orgRole: orgRole as ImportOrgRole,
    password,
    demographics: demographicsResult.data,
  }
}

function fail(error: string) {
  return { success: false as const, error }
}
