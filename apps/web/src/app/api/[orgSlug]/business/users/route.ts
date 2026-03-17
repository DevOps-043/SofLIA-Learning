import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/utils/logger'
import { BusinessUsersServerService } from '@/features/business-panel/services/businessUsers.server.service'
import { requireBusiness } from '@/lib/auth/requireBusiness'
import { CreateBusinessUserRequest } from '@/features/business-panel/services/businessUsers.service'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orgSlug: string }> }
) {
  try {
    const { orgSlug } = await params

    const auth = await requireBusiness({ organizationSlug: orgSlug })
    if (auth instanceof NextResponse) return auth

    if (!auth.organizationId) {
      return NextResponse.json(
        { success: false, error: 'No tienes una organización asignada' },
        { status: 403 }
      )
    }

    const [users, stats, invitationsResult, inviteLinksResult, { data: orgInfo }] = await Promise.all([
      BusinessUsersServerService.getOrganizationUsers(auth.organizationId),
      BusinessUsersServerService.getOrganizationStats(auth.organizationId),
      (await createClient()).from('user_invitations').select('id, email, role, status, created_at, expires_at, metadata').eq('organization_id', auth.organizationId).eq('status', 'pending'),
      (await createClient()).from('bulk_invite_links').select('*').eq('organization_id', auth.organizationId).order('created_at', { ascending: false }),
      (await createClient()).from('organizations').select('id, name, logo_url, brand_logo_url').eq('id', auth.organizationId).single()
    ])

    return NextResponse.json({
      success: true,
      users: users || [],
      stats: stats || {},
      invitations: invitationsResult.data || [],
      inviteLinks: inviteLinksResult.data || [],
      organization: {
        id: auth.organizationId,
        name: orgInfo?.name || '',
        logo_url: orgInfo?.brand_logo_url || orgInfo?.logo_url || null
      }
    }, {
      headers: {
        'Cache-Control': 'private, no-cache, no-store, must-revalidate'
      }
    })
  } catch (error) {
    logger.error('💥 Error in /api/[orgSlug]/business/users GET:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener usuarios de la organización', users: [] },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orgSlug: string }> }
) {
  try {
    const { orgSlug } = await params

    const auth = await requireBusiness({ organizationSlug: orgSlug })
    if (auth instanceof NextResponse) return auth

    if (!auth.organizationId) {
      return NextResponse.json(
        { success: false, error: 'No tienes una organización asignada' },
        { status: 403 }
      )
    }

    // SECURITY: Solo owner y admin de la organización pueden crear/invitar usuarios.
    // Un miembro (member) no tiene permisos de gestión sobre otros usuarios.
    if (!auth.isOrgAdmin) {
      logger.warn('Member attempted to create user — access denied', {
        userId: auth.userId,
        orgSlug,
        organizationRole: auth.organizationRole
      })
      return NextResponse.json(
        { success: false, error: 'No tienes permisos para gestionar usuarios en esta organización.' },
        { status: 403 }
      )
    }

    const body = await request.json()

    // SECURITY: Restringir los roles que se pueden asignar según el rol del solicitante.
    // Un admin no puede crear owners; solo el owner puede asignar el rol de owner.
    const requestedRole: string = body.org_role || 'member'
    const allowedRoles = auth.organizationRole === 'owner'
      ? ['member', 'admin', 'owner']
      : ['member', 'admin']

    if (!allowedRoles.includes(requestedRole)) {
      return NextResponse.json(
        { success: false, error: `No tienes permisos para asignar el rol '${requestedRole}'.` },
        { status: 403 }
      )
    }

    const userData: CreateBusinessUserRequest = {
      username: body.username,
      email: body.email,
      password: body.password,
      first_name: body.first_name,
      last_name: body.last_name,
      display_name: body.display_name,
      job_title: body.job_title,
      org_role: requestedRole,
      send_invitation: body.send_invitation !== undefined ? body.send_invitation : !body.password
    }

    const newUser = await BusinessUsersServerService.createOrganizationUser(
      auth.organizationId,
      userData,
      auth.userId
    )

    return NextResponse.json({ success: true, user: newUser })
  } catch (error) {
    logger.error('💥 Error in /api/[orgSlug]/business/users POST:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Error al crear usuario' },
      { status: 500 }
    )
  }
}
