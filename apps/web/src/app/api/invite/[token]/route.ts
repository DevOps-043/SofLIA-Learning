import { logger as techDebtLogger } from '@/lib/utils/logger'
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  consumeBulkInvitation,
  createInvitationRuntime,
} from '@/features/auth/actions/invitation/index'
import { fromLoose } from '@/lib/supabase/looseQuery'
import { apiError } from '@/lib/api/errors'
import { withZodBody } from '@/lib/api/with-validation'
import { SELECT_COLUMNS } from '@/lib/supabase/select-types'
import { acceptInviteSchema, type AcceptInviteBody } from './schema'

interface BulkInviteOrganizationRow {
  id: string
  name: string | null
  slug: string | null
  logo_url: string | null
  brand_logo_url: string | null
  brand_favicon_url: string | null
  brand_color_primary: string | null
  brand_color_accent: string | null
  google_login_enabled: boolean | null
  microsoft_login_enabled: boolean | null
}

interface BulkInviteLinkRow {
  id: string
  token: string
  name: string | null
  max_uses: number | null
  current_uses: number | null
  role: string | null
  expires_at: string
  status: string
  organization_id: string
  organizations: BulkInviteOrganizationRow | BulkInviteOrganizationRow[] | null
}

function bulkInviteLinksTable(client: unknown) {
  return fromLoose<BulkInviteLinkRow, { status?: string }>(
    client,
    'bulk_invite_links',
  )
}

function normalizeOrganization(
  organization: BulkInviteLinkRow['organizations'],
): BulkInviteOrganizationRow | null {
  return Array.isArray(organization) ? (organization[0] ?? null) : organization
}

// GET - Validate an invite token (public endpoint)
export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await params

    if (!token || token.length < 10) {
      return NextResponse.json(
        { success: false, error: 'Token inválido', valid: false },
        { status: 400 },
      )
    }

    // The token is the bearer credential. This server-only endpoint exposes a
    // deliberately narrow projection; browser roles cannot query the table.
    const supabase = createAdminClient()

    // Get the invite link and organization details
    const { data: link, error } = await bulkInviteLinksTable(supabase)
      .select(
        `
        id,
        token,
        name,
        max_uses,
        current_uses,
        role,
        expires_at,
        status,
        organization_id,
        organizations (
          id,
          name,
          slug,
          logo_url,
          brand_logo_url,
          brand_favicon_url,
          brand_color_primary,
          brand_color_accent,
          google_login_enabled,
          microsoft_login_enabled
        )
      `,
      )
      .eq('token', token)
      .single()

    if (error) {
      if (error.code !== 'PGRST116') {
        techDebtLogger.error('Error resolving bulk invite link:', {
          code: error.code,
          details: error.details,
          hint: error.hint,
          message: error.message,
        })
        return NextResponse.json(
          {
            success: false,
            error: 'No fue posible validar el enlace de invitacion',
            valid: false,
            reason: 'validation_error',
          },
          { status: 500 },
        )
      }

      return NextResponse.json(
        {
          success: false,
          error: 'Enlace de invitación no encontrado',
          valid: false,
          reason: 'not_found',
        },
        { status: 404 },
      )
    }

    if (!link) {
      return NextResponse.json(
        {
          success: false,
          error: 'Enlace de invitación no encontrado',
          valid: false,
          reason: 'not_found',
        },
        { status: 404 },
      )
    }

    // Check if link is active
    if (link.status !== 'active') {
      let reason = 'inactive'
      let message = 'Este enlace de invitación no está activo'

      if (link.status === 'expired') {
        reason = 'expired'
        message = 'Este enlace de invitación ha expirado'
      } else if (link.status === 'exhausted') {
        reason = 'exhausted'
        message =
          'Este enlace de invitación ha alcanzado el límite de registros'
      } else if (link.status === 'paused') {
        reason = 'paused'
        message = 'Este enlace de invitación está temporalmente pausado'
      }

      return NextResponse.json(
        { success: false, error: message, valid: false, reason },
        { status: 400 },
      )
    }

    // Check expiration
    if (new Date(link.expires_at) <= new Date()) {
      // Update status to expired
      await bulkInviteLinksTable(supabase)
        .update({ status: 'expired' })
        .eq('id', link.id)

      return NextResponse.json(
        {
          success: false,
          error: 'Este enlace de invitación ha expirado',
          valid: false,
          reason: 'expired',
        },
        { status: 400 },
      )
    }

    // Check if max uses reached
    if (
      (link.current_uses ?? 0) >= (link.max_uses ?? Number.POSITIVE_INFINITY)
    ) {
      // Update status to exhausted
      await bulkInviteLinksTable(supabase)
        .update({ status: 'exhausted' })
        .eq('id', link.id)

      return NextResponse.json(
        {
          success: false,
          error:
            'Este enlace de invitación ha alcanzado el límite de registros',
          valid: false,
          reason: 'exhausted',
        },
        { status: 400 },
      )
    }

    // Link is valid
    const organization = normalizeOrganization(link.organizations)

    return NextResponse.json({
      success: true,
      valid: true,
      invite: {
        id: link.id,
        name: link.name,
        role: link.role,
        remainingUses: (link.max_uses ?? 0) - (link.current_uses ?? 0),
        expiresAt: link.expires_at,
      },
      organization: organization
        ? {
            id: organization.id,
            name: organization.name,
            slug: organization.slug,
            logoUrl:
              organization.brand_logo_url ||
              organization.logo_url ||
              organization.brand_favicon_url ||
              null,
            primaryColor: organization.brand_color_primary,
            accentColor: organization.brand_color_accent,
            googleLoginEnabled: organization.google_login_enabled,
            microsoftLoginEnabled: organization.microsoft_login_enabled,
          }
        : null,
    })
  } catch (error) {
    techDebtLogger.error('Error in GET /api/invite/[token]:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor', valid: false },
      { status: 500 },
    )
  }
}

// POST - Accept an invite link (for authenticated users)
async function handlePost(
  _request: NextRequest,
  body: AcceptInviteBody,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await params

    if (!token) {
      return apiError('INVITE_TOKEN_REQUIRED', 'Token es requerido', 400)
    }

    // SECURITY FIX: Verificar identidad del usuario desde el servidor,
    // NO confiar en el userId que envía el cliente desde el browser.
    // Esto previene que una sesión de admin/owner acepte invitaciones
    // en nombre de otro usuario, o que se inyecte un userId arbitrario.
    const runtime = await createInvitationRuntime()
    const authenticatedUserId = await runtime.repo.resolveAuthenticatedUserId()

    if (!authenticatedUserId) {
      return NextResponse.json(
        { success: false, error: 'No autenticado. Por favor inicia sesión.' },
        { status: 401 },
      )
    }

    // Validación extra de defensa: si el cliente envía userId, verificar que coincida
    const { userId: clientUserId } = body
    if (clientUserId && clientUserId !== authenticatedUserId) {
      techDebtLogger.error(
        '[SECURITY] Invite userId mismatch — client:',
        clientUserId,
        'session:',
        authenticatedUserId,
      )
      return NextResponse.json(
        { success: false, error: 'No autorizado.' },
        { status: 403 },
      )
    }

    const result = await consumeBulkInvitation(
      token,
      authenticatedUserId,
      runtime,
    )

    if (!result.success) {
      const status = result.error?.includes('encontrado') ? 404 : 400
      return NextResponse.json(
        { success: false, error: result.error },
        { status },
      )
    }

    return NextResponse.json({
      success: true,
      alreadyMember: result.alreadyMember ?? false,
      message: result.alreadyMember
        ? 'Ya formas parte de esta organización'
        : 'Te has unido exitosamente a la organización',
      organizationSlug: result.organizationSlug || null,
    })
  } catch (error) {
    techDebtLogger.error('Error in POST /api/invite/[token]:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 },
    )
  }
}

export const POST = withZodBody(acceptInviteSchema, handlePost, {
  emptyBodyFallback: {},
})
