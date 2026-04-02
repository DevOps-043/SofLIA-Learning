'use server'

import { createHash, randomBytes } from 'crypto'
import { cookies } from 'next/headers'
import { z } from 'zod'

import { logger } from '../../../lib/logger'
import { fromLoose } from '../../../lib/supabase/looseQuery'
import { createClient } from '../../../lib/supabase/server'
import { emailService } from '../services/email.service'

const inviteUserSchema = z.object({
  email: z.string().email('Email invalido'),
  role: z.enum(['owner', 'admin', 'member']).default('member'),
  organizationId: z.string().uuid('ID de organizacion invalido'),
  customMessage: z.string().max(500).optional(),
  position: z.string().max(100).optional(),
})

const validateInvitationSchema = z.object({
  token: z.string().min(64, 'Token invalido').max(64, 'Token invalido'),
})

type InvitationRole = z.infer<typeof inviteUserSchema>['role']
type InvitationStatus = 'pending' | 'accepted' | 'expired' | 'revoked'

interface InviteResult {
  success: boolean
  error?: string
  invitationId?: string
}

interface ValidateResult {
  valid: boolean
  email?: string
  role?: string
  position?: string
  organizationId?: string
  organizationName?: string
  organizationSlug?: string
  error?: string
}

interface ConsumeResult {
  success: boolean
  error?: string
}

interface FindInvitationResult {
  hasInvitation: boolean
  role?: string
  position?: string
  error?: string
}

interface UserRow {
  id: string
  cargo_rol?: string | null
}

interface OrganizationRow {
  id?: string
  name?: string | null
  slug?: string | null
  logo_url?: string | null
}

interface OrganizationUserRow {
  id: string
}

interface OrganizationUserWrite {
  organization_id: string
  user_id: string
  role: string
  status: string
  joined_at: string
}

interface UserInvitationMetadata {
  position?: string | null
  custom_message?: string | null
}

interface UserInvitationRow {
  id: string
  email: string
  token: string
  role: string
  status: InvitationStatus | string
  expires_at: string
  organization_id: string
  metadata: UserInvitationMetadata | null
  created_at: string | null
  organizations?: OrganizationRow | null
}

interface UserInvitationWrite {
  email?: string
  token?: string
  role?: string
  organization_id?: string
  expires_at?: string
  metadata?: UserInvitationMetadata | null
  status?: string
  accepted_at?: string
}

interface UserSessionRow {
  user_id: string
}

interface RefreshTokenRow {
  user_id: string
}

interface BulkInviteLinkRow {
  id: string
  role: string | null
  max_uses: number | null
  current_uses: number | null
  expires_at: string
  status: string
  organization_id: string
}

interface BulkInviteLinkWrite {
  status?: string
  current_uses?: number
}

interface BulkInviteRegistrationWrite {
  bulk_invite_link_id: string
  user_id: string
}

function usersTable(client: unknown) {
  return fromLoose<UserRow, Partial<UserRow>>(client, 'users')
}

function organizationsTable(client: unknown) {
  return fromLoose<OrganizationRow>(client, 'organizations')
}

function organizationUsersTable(client: unknown) {
  return fromLoose<OrganizationUserRow, OrganizationUserWrite>(
    client,
    'organization_users'
  )
}

function userInvitationsTable(client: unknown) {
  return fromLoose<UserInvitationRow, UserInvitationWrite>(
    client,
    'user_invitations'
  )
}

function userSessionsTable(client: unknown) {
  return fromLoose<UserSessionRow>(client, 'user_session')
}

function refreshTokensTable(client: unknown) {
  return fromLoose<RefreshTokenRow>(client, 'refresh_tokens')
}

function bulkInviteLinksTable(client: unknown) {
  return fromLoose<BulkInviteLinkRow, BulkInviteLinkWrite>(
    client,
    'bulk_invite_links'
  )
}

function bulkInviteRegistrationsTable(client: unknown) {
  return fromLoose<never, BulkInviteRegistrationWrite>(
    client,
    'bulk_invite_registrations'
  )
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

function isInvitationToken(value: string) {
  return value.length === 64 && /^[a-f0-9]+$/i.test(value)
}

function getInvitationPosition(metadata?: UserInvitationMetadata | null) {
  return metadata?.position ?? undefined
}

async function resolveAuthenticatedUserId(supabase: unknown) {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get('aprende-y-aplica-session')

  if (sessionCookie?.value) {
    const { data: session } = await userSessionsTable(supabase)
      .select('user_id')
      .eq('jwt_id', sessionCookie.value)
      .eq('revoked', false)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (session?.user_id) {
      return session.user_id
    }
  }

  const refreshTokenCookie = cookieStore.get('refresh_token')
  const accessTokenCookie = cookieStore.get('access_token')

  if (!refreshTokenCookie?.value || !accessTokenCookie?.value) {
    return null
  }

  const tokenHash = createHash('sha256')
    .update(refreshTokenCookie.value)
    .digest('hex')

  const { data: refreshToken } = await refreshTokensTable(supabase)
    .select('user_id')
    .eq('token_hash', tokenHash)
    .eq('is_revoked', false)
    .gt('expires_at', new Date().toISOString())
    .single()

  return refreshToken?.user_id ?? null
}

export async function inviteUserAction(
  input:
    | {
        email: string
        role?: InvitationRole
        organizationId: string
        customMessage?: string
        position?: string
      }
    | FormData
): Promise<InviteResult> {
  try {
    const data =
      input instanceof FormData
        ? inviteUserSchema.parse({
            email: input.get('email'),
            role: input.get('role') || 'member',
            organizationId: input.get('organizationId'),
            customMessage: input.get('customMessage') || undefined,
            position: input.get('position') || undefined,
          })
        : inviteUserSchema.parse({
            ...input,
            role: input.role || 'member',
          })

    const supabase = await createClient()
    const normalizedEmail = normalizeEmail(data.email)

    const { data: existingUser } = await usersTable(supabase)
      .select('id')
      .ilike('email', data.email.trim())
      .single()

    if (existingUser) {
      const { data: orgUser } = await organizationUsersTable(supabase)
        .select('id')
        .eq('user_id', existingUser.id)
        .eq('organization_id', data.organizationId)
        .single()

      if (orgUser) {
        return {
          success: false,
          error: 'Este usuario ya pertenece a la organizacion',
        }
      }
    }

    const { data: existingInvitation } = await userInvitationsTable(supabase)
      .select('id')
      .ilike('email', data.email.trim())
      .eq('organization_id', data.organizationId)
      .eq('status', 'pending')
      .single()

    if (existingInvitation) {
      return {
        success: false,
        error: 'Ya existe una invitacion pendiente para este email',
      }
    }

    const token = randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

    const { data: invitation, error: insertError } = await userInvitationsTable(
      supabase
    )
      .insert({
        email: normalizedEmail,
        token,
        role: data.role,
        organization_id: data.organizationId,
        expires_at: expiresAt.toISOString(),
        metadata: {
          position: data.position ?? null,
          custom_message: data.customMessage ?? null,
        },
      })
      .select('id')
      .single()

    if (insertError || !invitation) {
      logger.error('Error creating invitation:', insertError)
      return { success: false, error: 'Error al crear invitacion' }
    }

    const { data: organization } = await organizationsTable(supabase)
      .select('name, slug, logo_url')
      .eq('id', data.organizationId)
      .single()

    try {
      await emailService.sendOrganizationInvitationEmail(
        data.email,
        token,
        organization?.name ?? 'Organizacion',
        organization?.slug ?? '',
        data.customMessage,
        organization?.logo_url ?? undefined
      )

      logger.info('Invitation sent successfully', {
        email: data.email,
        organizationId: data.organizationId,
        invitationId: invitation.id,
      })
    } catch (emailError) {
      logger.error('Error sending invitation email:', emailError)
    }

    return {
      success: true,
      invitationId: invitation.id,
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0]?.message ?? 'Datos invalidos' }
    }

    logger.error('Error in inviteUserAction:', error)
    return { success: false, error: 'Error procesando invitacion' }
  }
}

export async function validateInvitationAction(
  token: string
): Promise<ValidateResult> {
  try {
    const parsed = validateInvitationSchema.parse({ token })
    const supabase = await createClient()

    const { data: invitation, error } = await userInvitationsTable(supabase)
      .select(`
        id,
        email,
        role,
        status,
        expires_at,
        organization_id,
        metadata,
        organizations (
          id,
          name,
          slug,
          logo_url
        )
      `)
      .eq('token', parsed.token)
      .single()

    if (error || !invitation) {
      return { valid: false, error: 'Invitacion no encontrada' }
    }

    if (invitation.status !== 'pending') {
      if (invitation.status === 'accepted') {
        return { valid: false, error: 'Esta invitacion ya fue utilizada' }
      }
      if (invitation.status === 'revoked') {
        return { valid: false, error: 'Esta invitacion fue revocada' }
      }
      return { valid: false, error: 'Esta invitacion ya no es valida' }
    }

    if (new Date(invitation.expires_at) < new Date()) {
      await userInvitationsTable(supabase)
        .update({ status: 'expired' })
        .eq('id', invitation.id)

      return { valid: false, error: 'Esta invitacion ha expirado' }
    }

    return {
      valid: true,
      email: invitation.email,
      role: invitation.role,
      position: getInvitationPosition(invitation.metadata),
      organizationId: invitation.organization_id,
      organizationName: invitation.organizations?.name ?? undefined,
      organizationSlug: invitation.organizations?.slug ?? undefined,
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { valid: false, error: 'Token invalido' }
    }

    logger.error('Error in validateInvitationAction:', error)
    return { valid: false, error: 'Error validando invitacion' }
  }
}

export async function consumeInvitationAction(
  tokenOrEmail: string,
  organizationId: string,
  userId: string
): Promise<ConsumeResult> {
  try {
    const supabase = await createClient()

    const { data: invitation } = isInvitationToken(tokenOrEmail)
      ? await userInvitationsTable(supabase)
          .select('id, email, role, organization_id')
          .eq('token', tokenOrEmail)
          .eq('status', 'pending')
          .single()
      : await userInvitationsTable(supabase)
          .select('id, email, role, organization_id')
          .ilike('email', tokenOrEmail.trim())
          .eq('organization_id', organizationId)
          .eq('status', 'pending')
          .single()

    if (!invitation) {
      logger.warn('Invitation not found during consume', {
        tokenOrEmail,
        organizationId,
      })
      return { success: true }
    }

    const { error: updateError } = await userInvitationsTable(supabase)
      .update({
        status: 'accepted',
        accepted_at: new Date().toISOString(),
      })
      .eq('id', invitation.id)

    if (updateError) {
      logger.error('Error updating invitation:', updateError)
      return { success: false, error: 'Error actualizando invitacion' }
    }

    logger.info('Invitation consumed successfully', {
      invitationId: invitation.id,
      userId,
      organizationId,
    })

    return { success: true }
  } catch (error) {
    logger.error('Error in consumeInvitationAction:', error)
    return { success: false, error: 'Error consumiendo invitacion' }
  }
}

export async function findInvitationByEmailAction(
  email: string,
  organizationId: string
): Promise<FindInvitationResult> {
  try {
    const supabase = await createClient()

    const { data: invitation } = await userInvitationsTable(supabase)
      .select('id, role, expires_at, metadata')
      .ilike('email', email.trim())
      .eq('organization_id', organizationId)
      .eq('status', 'pending')
      .single()

    if (!invitation) {
      return { hasInvitation: false }
    }

    if (new Date(invitation.expires_at) < new Date()) {
      await userInvitationsTable(supabase)
        .update({ status: 'expired' })
        .eq('id', invitation.id)

      return { hasInvitation: false, error: 'La invitacion ha expirado' }
    }

    return {
      hasInvitation: true,
      role: invitation.role,
      position: getInvitationPosition(invitation.metadata),
    }
  } catch (error) {
    logger.error('Error in findInvitationByEmailAction:', error)
    return { hasInvitation: false, error: 'Error buscando invitacion' }
  }
}

export async function revokeInvitationAction(
  invitationId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    const { error } = await userInvitationsTable(supabase)
      .update({ status: 'revoked' })
      .eq('id', invitationId)
      .eq('status', 'pending')

    if (error) {
      return { success: false, error: 'Error revocando invitacion' }
    }

    return { success: true }
  } catch (error) {
    logger.error('Error in revokeInvitationAction:', error)
    return { success: false, error: 'Error revocando invitacion' }
  }
}

export async function listOrganizationInvitationsAction(
  organizationId: string,
  status?: InvitationStatus
): Promise<{
  success: boolean
  invitations?: Array<{
    id: string
    email: string
    role: string
    status: string
    created_at: string
    expires_at: string
    metadata: UserInvitationMetadata | null
  }>
  error?: string
}> {
  try {
    const supabase = await createClient()

    let query = userInvitationsTable(supabase)
      .select('id, email, role, status, created_at, expires_at, metadata')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })

    if (status) {
      query = query.eq('status', status)
    }

    const { data: invitations, error } = await query

    if (error) {
      return { success: false, error: 'Error obteniendo invitaciones' }
    }

    return {
      success: true,
      invitations: (invitations ?? []).map((invitation) => ({
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        status: invitation.status,
        created_at: invitation.created_at ?? '',
        expires_at: invitation.expires_at,
        metadata: invitation.metadata,
      })),
    }
  } catch (error) {
    logger.error('Error in listOrganizationInvitationsAction:', error)
    return { success: false, error: 'Error listando invitaciones' }
  }
}

export async function resendInvitationAction(
  invitationId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    const { data: invitation, error: fetchError } = await userInvitationsTable(
      supabase
    )
      .select(`
        id,
        email,
        token,
        status,
        organization_id,
        metadata,
        organizations (
          name,
          slug,
          logo_url
        )
      `)
      .eq('id', invitationId)
      .single()

    if (fetchError || !invitation) {
      return { success: false, error: 'Invitacion no encontrada' }
    }

    if (invitation.status !== 'pending') {
      return {
        success: false,
        error: 'Solo se pueden reenviar invitaciones pendientes',
      }
    }

    const newToken = randomBytes(32).toString('hex')
    const newExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

    const { error: updateError } = await userInvitationsTable(supabase)
      .update({
        token: newToken,
        expires_at: newExpiry.toISOString(),
      })
      .eq('id', invitationId)

    if (updateError) {
      return { success: false, error: 'Error actualizando invitacion' }
    }

    try {
      await emailService.sendOrganizationInvitationEmail(
        invitation.email,
        newToken,
        invitation.organizations?.name ?? 'Organizacion',
        invitation.organizations?.slug ?? '',
        invitation.metadata?.custom_message ?? undefined,
        invitation.organizations?.logo_url ?? undefined
      )
    } catch (emailError) {
      logger.error('Error resending invitation email:', emailError)
      return { success: false, error: 'Error enviando email' }
    }

    return { success: true }
  } catch (error) {
    logger.error('Error in resendInvitationAction:', error)
    return { success: false, error: 'Error reenviando invitacion' }
  }
}

export async function consumeBulkInvitationAction(
  token: string,
  userId: string
): Promise<{ success: boolean; error?: string; organizationSlug?: string }> {
  try {
    const supabase = await createClient()
    const authenticatedUserId = await resolveAuthenticatedUserId(supabase)

    if (!authenticatedUserId) {
      logger.warn('consumeBulkInvitationAction called without a valid session')
      return {
        success: false,
        error: 'No autenticado. Por favor inicia sesion.',
      }
    }

    if (authenticatedUserId !== userId) {
      logger.error('consumeBulkInvitationAction user mismatch', {
        sessionUser: authenticatedUserId,
        requestedUser: userId,
      })
      return { success: false, error: 'No autorizado.' }
    }

    const { data: link, error: linkError } = await bulkInviteLinksTable(supabase)
      .select(`
        id,
        role,
        max_uses,
        current_uses,
        expires_at,
        status,
        organization_id
      `)
      .eq('token', token)
      .single()

    if (linkError || !link) {
      return { success: false, error: 'Enlace de invitacion no encontrado' }
    }

    if (link.status !== 'active') {
      return { success: false, error: 'Este enlace de invitacion no esta activo' }
    }

    if (new Date(link.expires_at) <= new Date()) {
      await bulkInviteLinksTable(supabase)
        .update({ status: 'expired' })
        .eq('id', link.id)

      return { success: false, error: 'Este enlace de invitacion ha expirado' }
    }

    const currentUses = link.current_uses ?? 0
    const maxUses = link.max_uses ?? Number.POSITIVE_INFINITY

    if (currentUses >= maxUses) {
      await bulkInviteLinksTable(supabase)
        .update({ status: 'exhausted' })
        .eq('id', link.id)

      return {
        success: false,
        error: 'Este enlace ha alcanzado el limite de registros',
      }
    }

    const { data: user, error: userError } = await usersTable(supabase)
      .select('id')
      .eq('id', userId)
      .single()

    if (userError || !user) {
      return { success: false, error: 'Usuario no encontrado' }
    }

    const { data: existingMember } = await organizationUsersTable(supabase)
      .select('id')
      .eq('user_id', userId)
      .eq('organization_id', link.organization_id)
      .single()

    if (existingMember) {
      return { success: false, error: 'Ya perteneces a esta organizacion' }
    }

    const { error: insertError } = await organizationUsersTable(supabase).insert({
      organization_id: link.organization_id,
      user_id: userId,
      role: link.role ?? 'member',
      status: 'active',
      joined_at: new Date().toISOString(),
    })

    if (insertError) {
      logger.error('Error joining user to organization from bulk invite:', insertError)
      return { success: false, error: 'Error al unirte a la organizacion' }
    }

    await usersTable(supabase)
      .update({ cargo_rol: 'Business' })
      .eq('id', userId)
      .neq('cargo_rol', 'Administrador')

    await bulkInviteLinksTable(supabase)
      .update({ current_uses: currentUses + 1 })
      .eq('id', link.id)

    await bulkInviteRegistrationsTable(supabase).insert({
      bulk_invite_link_id: link.id,
      user_id: userId,
    })

    const { data: organization } = await organizationsTable(supabase)
      .select('slug')
      .eq('id', link.organization_id)
      .single()

    return {
      success: true,
      organizationSlug: organization?.slug ?? undefined,
    }
  } catch (error) {
    logger.error('Error in consumeBulkInvitationAction:', error)
    return {
      success: false,
      error: 'Error interno al procesar invitacion',
    }
  }
}
