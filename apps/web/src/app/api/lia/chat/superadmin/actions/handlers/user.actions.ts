import { randomBytes } from 'node:crypto'
import { z } from 'zod'
import { AdminUsersService } from '@/features/admin/services/adminUsers.service'
import { resolveTargetUser } from '../entity-resolution'
import { defineAction } from '../types'

/**
 * Acciones sobre usuarios. Delegan en `AdminUsersService`, el mismo servicio
 * que usan las rutas `/api/admin/users` (incluida su auditoría interna).
 */

const setUserBanSchema = z.object({
  user: z.string().min(1).max(320),
  banned: z.boolean(),
  reason: z.string().min(1).max(500).optional(),
})

type SetUserBanParams = z.infer<typeof setUserBanSchema>

export const setUserBanAction = defineAction<SetUserBanParams>({
  id: 'set_user_ban',
  risk: 'sensitive',
  description:
    'Banea o reactiva a un usuario de la plataforma. Identifícalo por email o ID. Al banear, un motivo es muy recomendable.',
  paramsExample: {
    user: 'usuario@empresa.com',
    banned: true,
    reason: 'Uso indebido de la plataforma',
  },
  schema: setUserBanSchema,

  async preview(params) {
    const user = await resolveTargetUser(params.user)

    const warnings: string[] = []
    if (params.banned) {
      warnings.push(
        'El usuario perderá el acceso de inmediato y sus sesiones activas dejarán de ser válidas.',
      )
      if (!params.reason) {
        warnings.push('No se indicó un motivo de baneo (queda sin registrar).')
      }
    }
    if (user.isBanned === params.banned) {
      warnings.push(
        `El usuario ya está ${params.banned ? 'baneado' : 'activo'}; la acción no cambiaría nada.`,
      )
    }

    return {
      summary: `${params.banned ? 'BANEAR' : 'Reactivar'} al usuario "${user.displayName}" (${user.email ?? 'sin email'}).`,
      warnings,
    }
  },

  async execute(params, context) {
    const user = await resolveTargetUser(params.user)

    await AdminUsersService.updateUser(
      user.id,
      {
        is_banned: params.banned,
        // Al reactivar se limpia el motivo; el servicio ya normaliza banned_at.
        ban_reason: params.banned ? (params.reason ?? null) : null,
      },
      context.adminUserId,
      context.requestInfo,
    )

    return {
      summary: `Usuario "${user.displayName}" ${params.banned ? 'baneado' : 'reactivado'} correctamente.`,
      details: { userId: user.id, banned: params.banned },
    }
  },
})

const createUserSchema = z.object({
  email: z.string().email().max(320),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100).optional(),
  role: z.enum(['Administrador', 'Instructor', 'Usuario']).default('Usuario'),
})

type CreateUserParams = z.infer<typeof createUserSchema>

/** Contraseña temporal robusta: el admin la entrega al usuario, que debe cambiarla. */
function generateTemporaryPassword(): string {
  return `${randomBytes(12).toString('base64url')}Aa1!`
}

/** Deriva un username único a partir del email (el servicio exige uno). */
function buildUsernameFromEmail(email: string): string {
  const localPart = email.split('@')[0].replace(/[^a-zA-Z0-9._-]/g, '').slice(0, 24)
  const suffix = randomBytes(3).toString('hex')
  return `${localPart || 'user'}-${suffix}`
}

export const createUserAction = defineAction<CreateUserParams>({
  id: 'create_user',
  risk: 'sensitive',
  description:
    'Crea un usuario nuevo en la plataforma con una contraseña temporal generada por el servidor. El rol por defecto es "Usuario".',
  paramsExample: {
    email: 'nuevo@empresa.com',
    firstName: 'Ana',
    lastName: 'López',
    role: 'Usuario',
  },
  schema: createUserSchema,

  async preview(params) {
    const warnings = ['Se generará una contraseña temporal que deberás entregar al usuario.']
    if (params.role === 'Administrador') {
      warnings.push(
        'ATENCIÓN: el rol "Administrador" otorga acceso total de superadmin a toda la plataforma.',
      )
    }

    const fullName = [params.firstName, params.lastName].filter(Boolean).join(' ')

    return {
      summary: `Crear el usuario "${fullName}" con email ${params.email} y rol ${params.role}.`,
      warnings,
    }
  },

  async execute(params, context) {
    const temporaryPassword = generateTemporaryPassword()

    const user = await AdminUsersService.createUser(
      {
        username: buildUsernameFromEmail(params.email),
        email: params.email,
        password: temporaryPassword,
        first_name: params.firstName,
        last_name: params.lastName ?? null,
        cargo_rol: params.role,
      },
      context.adminUserId,
      context.requestInfo,
    )

    return {
      summary: `Usuario ${params.email} creado con rol ${params.role}.`,
      details: {
        userId: user.id,
        temporaryPassword,
      },
    }
  },
})
