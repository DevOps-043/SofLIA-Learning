'use server'

import { z } from 'zod'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '../../../lib/supabase/server'
import { requireHumanVerification } from '@/lib/security/bot-protection'
import { recordSecurityEvent } from '@/lib/security/security-events'
import {
  normalizeDateOfBirthForStorage,
  normalizeGenderForStorage,
  RegisterDemographicsSchema,
} from '../../../lib/schemas/user-demographics.schema'
import { passwordSchema } from '../../../lib/validation/password-security'
import {
  mapProvisioningError,
  provisionAuthAccount,
  rollbackProvisionedAuthAccount,
} from '../services/auth-account-provisioning.service'
import { logger as techDebtLogger } from '@/lib/utils/logger'
import { validatePasswordIsNotBreached } from './password-breach-check.server'
import { validatePublicRegistrationEmail } from './registration-email-policy.server'
import {
  consumeInvitationAction,
  findInvitationByEmailAction,
  validateInvitationAction,
} from './invitation'
import { createInvitationRepository } from './invitation/repository'
import { finalizeBulkInviteRegistration } from './invitation/invitation-redemption.service'
import { validateBulkInviteRegistration } from './invitation/invitation-validation.service'
import { sendSupabaseSignupConfirmation } from '../services/supabase-auth-bridge.service'

const registerSchema = z
  .object({
    firstName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
    lastName: z.string().min(2, 'El apellido debe tener al menos 2 caracteres'),
    username: z
      .string()
      .min(3, 'El usuario debe tener al menos 3 caracteres')
      .max(20, 'El usuario no puede tener mas de 20 caracteres')
      .regex(
        /^[a-zA-Z0-9_]+$/,
        'El usuario solo puede contener letras, numeros y guiones bajos',
      ),
    email: z.string().email('Email invalido'),
    confirmEmail: z.string().email('Email de confirmacion invalido'),
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Confirma la contrasena'),
    countryCode: z.string().min(1, 'Selecciona un pais'),
    phoneNumber: z.string().min(1, 'El telefono es requerido'),
    dateOfBirth: RegisterDemographicsSchema.shape.dateOfBirth,
    gender: RegisterDemographicsSchema.shape.gender,
    cargo_titulo: z
      .string()
      .max(100, 'El cargo no puede exceder 100 caracteres')
      .optional(),
    acceptTerms: z.boolean().refine((value) => value === true, {
      message: 'Debes aceptar los terminos y condiciones',
    }),
  })
  .refine((data) => data.email === data.confirmEmail, {
    message: 'Los emails no coinciden',
    path: ['confirmEmail'],
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contrasenas no coinciden',
    path: ['confirmPassword'],
  })

interface OrganizationRegistrationContext {
  cargoTitle: string
  organizationId: string
  role: string
}

export async function registerAction(formData: FormData) {
  try {
    const humanVerification = await requireHumanVerification(formData)
    if (!humanVerification.ok) {
      recordSecurityEvent('registration-failure', {
        metadata: { reason: 'human_verification_failed' },
      })
      return { error: humanVerification.error || 'Verificacion humana requerida' }
    }

    const rawData = Object.fromEntries(formData)
    const parsed = registerSchema.parse({
      ...rawData,
      acceptTerms: rawData.acceptTerms === 'true' || rawData.acceptTerms === 'on',
    })
    const breachError = await validatePasswordIsNotBreached(parsed.password)
    if (breachError) return { error: breachError }
    const emailPolicyError = validatePublicRegistrationEmail(parsed.email)
    if (emailPolicyError) return { error: emailPolicyError }

    const supabase = await createClient()
    const invitationRepository = createInvitationRepository(supabase)
    const organizationContext = await resolveOrganizationRegistrationContext({
      bulkInviteToken: formData.get('bulkInviteToken')?.toString(),
      email: parsed.email,
      invitationToken: formData.get('invitationToken')?.toString(),
      organizationId: formData.get('organizationId')?.toString(),
      organizationSlug: formData.get('organizationSlug')?.toString(),
      submittedCargoTitle: parsed.cargo_titulo,
    })
    if (organizationContext && 'error' in organizationContext) {
      return { error: organizationContext.error }
    }

    const cargoRol = organizationContext ? 'Business' : 'Usuario'
    const displayName = `${parsed.firstName} ${parsed.lastName}`.trim()
    const provisioned = await provisionAuthAccount({
      cargoRol,
      countryCode: parsed.countryCode,
      dateOfBirth: normalizeDateOfBirthForStorage(parsed.dateOfBirth),
      displayName,
      email: parsed.email,
      emailVerified: false,
      firstName: parsed.firstName,
      gender: normalizeGenderForStorage(parsed.gender),
      lastName: parsed.lastName,
      password: parsed.password,
      phone: parsed.phoneNumber,
      username: parsed.username,
    }).catch((error) => {
      techDebtLogger.error('[registerAction] Error provisioning account:', error)
      return { error: mapProvisioningError(error) }
    })
    if ('error' in provisioned) return { error: provisioned.error }

    try {
      await sendSupabaseSignupConfirmation(parsed.email)
    } catch (error) {
      await rollbackProvisionedAuthAccount(provisioned.userId)
      techDebtLogger.error('[registerAction] Error sending email confirmation:', error)
      return {
        error:
          'No se pudo enviar el correo de verificacion. Intenta registrarte nuevamente mas tarde.',
      }
    }

    if (organizationContext) {
      const membershipResult = await createOrganizationMembership({
        cargoTitle: organizationContext.cargoTitle,
        organizationId: organizationContext.organizationId,
        role: organizationContext.role,
        userId: provisioned.userId,
      })
      if (membershipResult.error) {
        await rollbackProvisionedAuthAccount(provisioned.userId)
        return { error: membershipResult.error }
      }

      const consumeResult = await consumeRegistrationInvitation({
        bulkInviteToken: formData.get('bulkInviteToken')?.toString(),
        email: parsed.email,
        invitationRepository,
        invitationToken: formData.get('invitationToken')?.toString(),
        organizationId: organizationContext.organizationId,
        userId: provisioned.userId,
      })
      if (consumeResult.error) {
        await rollbackProvisionedAuthAccount(provisioned.userId)
        return { error: consumeResult.error }
      }
    }

    recordSecurityEvent('registration-success', {
      actorId: provisioned.userId,
      actorRole: cargoRol,
      orgId: organizationContext?.organizationId || null,
    })

    return {
      message:
        'Cuenta creada. Revisa tu correo y confirma la direccion antes de iniciar sesion.',
      success: true,
      userId: provisioned.userId,
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.errors[0]?.message || 'Error de validacion' }
    }
    techDebtLogger.error('[registerAction] Unexpected error:', error)
    return { error: 'Error inesperado' }
  }
}

async function resolveOrganizationRegistrationContext(input: {
  bulkInviteToken?: string
  email: string
  invitationToken?: string
  organizationId?: string
  organizationSlug?: string
  submittedCargoTitle?: string
}): Promise<OrganizationRegistrationContext | null | { error: string }> {
  if (!input.organizationId && !input.organizationSlug) return null
  if (!input.organizationId || !input.organizationSlug) {
    return { error: 'Organizacion no encontrada' }
  }

  const organizationResult = await validateRegistrationOrganization(
    input.organizationId,
    input.organizationSlug,
  )
  if (organizationResult.error) return organizationResult

  if (input.bulkInviteToken) {
    return resolveBulkInviteContext(input)
  }

  if (input.invitationToken) {
    return resolveIndividualInviteContext(input)
  }

  const invitation = await findInvitationByEmailAction(
    input.email,
    input.organizationId,
  )
  if (!invitation.hasInvitation) {
    return {
      error:
        invitation.error ||
        'Tu correo no ha sido invitado a esta organizacion. Contacta al administrador para solicitar una invitacion.',
    }
  }

  return {
    cargoTitle: invitation.position || input.submittedCargoTitle?.trim() || 'Usuario',
    organizationId: input.organizationId,
    role: invitation.role || 'member',
  }
}

async function validateRegistrationOrganization(
  organizationId: string,
  organizationSlug: string,
) {
  const supabase = await createClient()
  const { data: organization, error } = await supabase
    .from('organizations')
    .select('id, slug, subscription_plan, subscription_status, is_active')
    .eq('id', organizationId)
    .eq('slug', organizationSlug)
    .single()

  if (error || !organization) return { error: 'Organizacion no encontrada' }

  const allowedPlans = ['team', 'business', 'enterprise']
  const activeStatuses = ['active', 'trial']
  if (
    !allowedPlans.includes(organization.subscription_plan ?? '') ||
    !activeStatuses.includes(organization.subscription_status ?? '') ||
    !organization.is_active
  ) {
    return { error: 'Esta organizacion no permite nuevos registros' }
  }

  return {}
}

async function resolveBulkInviteContext(input: {
  bulkInviteToken?: string
  organizationId?: string
  submittedCargoTitle?: string
}) {
  const supabase = await createClient()
  const validation = await validateBulkInviteRegistration(
    createInvitationRepository(supabase),
    input.bulkInviteToken as string,
    input.organizationId as string,
  )

  if (!validation.valid) {
    return {
      error: validation.error || 'Enlace de invitacion invalido o expirado',
    }
  }

  return {
    cargoTitle: input.submittedCargoTitle?.trim() || 'Usuario',
    organizationId: input.organizationId as string,
    role: validation.role || 'member',
  }
}

async function resolveIndividualInviteContext(input: {
  email: string
  invitationToken?: string
  organizationId?: string
  submittedCargoTitle?: string
}) {
  const validation = await validateInvitationAction(input.invitationToken as string)
  if (!validation.valid) {
    return { error: validation.error || 'Invitacion invalida o expirada' }
  }
  if (validation.email?.toLowerCase() !== input.email.toLowerCase()) {
    return { error: 'El email no coincide con la invitacion' }
  }
  if (validation.organizationId !== input.organizationId) {
    return { error: 'Esta invitacion no es para esta organizacion' }
  }

  return {
    cargoTitle:
      validation.position || input.submittedCargoTitle?.trim() || 'Usuario',
    organizationId: input.organizationId as string,
    role: validation.role || 'member',
  }
}

async function createOrganizationMembership(input: {
  cargoTitle: string
  organizationId: string
  role: string
  userId: string
}) {
  const adminSupabase = createAdminClient()
  const { error } = await adminSupabase
    .from('organization_users')
    .upsert(
      {
        job_title: input.cargoTitle,
        joined_at: new Date().toISOString(),
        organization_id: input.organizationId,
        role: input.role,
        status: 'active',
        user_id: input.userId,
      },
      { onConflict: 'organization_id,user_id' },
    )

  if (!error) return {}
  techDebtLogger.error('[registerAction] Error creating organization membership:', error)
  return { error: 'Error al vincular la cuenta con la organizacion' }
}

async function consumeRegistrationInvitation(input: {
  bulkInviteToken?: string
  email: string
  invitationRepository: ReturnType<typeof createInvitationRepository>
  invitationToken?: string
  organizationId: string
  userId: string
}) {
  if (input.bulkInviteToken) {
    const result = await finalizeBulkInviteRegistration(
      input.invitationRepository,
      input.bulkInviteToken,
      input.organizationId,
      input.userId,
    )
    return result.success
      ? {}
      : { error: result.error || 'Error al finalizar la invitacion masiva' }
  }

  const result = await consumeInvitationAction(
    input.invitationToken || input.email,
    input.organizationId,
    input.userId,
  )
  return result.success
    ? {}
    : { error: result.error || 'Error al consumir la invitacion' }
}
