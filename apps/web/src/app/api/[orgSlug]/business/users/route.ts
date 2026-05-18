import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/utils/logger'
import { BusinessUsersServerService } from '@/features/business-panel/services/businessUsers.server.service'
import { requireBusiness } from '@/lib/auth/requireBusiness'
import { CreateBusinessUserRequest } from '@/features/business-panel/services/businessUsers.service'
import { createClient } from '@/lib/supabase/server'
import {
  buildPaginationMetadata,
  parsePaginationParams,
} from '@/lib/api/pagination'

type UsersResource = 'users' | 'invitations' | 'links'

function getResource(value: string | null): UsersResource {
  if (value === 'invitations' || value === 'links') return value
  return 'users'
}

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

    const { searchParams } = request.nextUrl
    const resource = getResource(searchParams.get('resource'))
    const { page, pageSize, rangeFrom, rangeTo } = parsePaginationParams(
      searchParams,
      { defaultPageSize: 24 },
    )
    const search = searchParams.get('search')?.trim() || undefined
    const role = searchParams.get('role') || undefined
    const status = searchParams.get('status') || undefined
    const supabase = await createClient()

    const [
      usersPage,
      stats,
      usersCountResult,
      invitationsCountResult,
      inviteLinksCountResult,
      { data: orgInfo },
    ] = await Promise.all([
      resource === 'users'
        ? BusinessUsersServerService.getOrganizationUsersPage(auth.organizationId, {
            page,
            pageSize,
            search,
            role,
            status,
          })
        : Promise.resolve({
            users: [],
            pagination: buildPaginationMetadata(page, pageSize, 0),
          }),
      BusinessUsersServerService.getOrganizationStats(auth.organizationId),
      supabase
        .from('organization_users')
        .select('user_id', { count: 'exact', head: true })
        .eq('organization_id', auth.organizationId),
      supabase
        .from('user_invitations')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', auth.organizationId)
        .eq('status', 'pending'),
      supabase
        .from('bulk_invite_links')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', auth.organizationId),
      supabase
        .from('organizations')
        .select('id, name, logo_url, brand_logo_url')
        .eq('id', auth.organizationId)
        .single()
    ])

    let invitations: unknown[] = []
    let inviteLinks: unknown[] = []
    let resourcePagination = usersPage.pagination

    if (resource === 'invitations') {
      let invitationsQuery = supabase
        .from('user_invitations')
        .select('id, email, role, status, created_at, expires_at, metadata', { count: 'exact' })
        .eq('organization_id', auth.organizationId)
        .eq('status', 'pending')

      if (search) {
        const escapedSearch = search.replace(/[%_]/g, '\\$&')
        invitationsQuery = invitationsQuery.or(
          `email.ilike.%${escapedSearch}%,role.ilike.%${escapedSearch}%`,
        )
      }

      const { data, error, count } = await invitationsQuery
        .order('created_at', { ascending: false })
        .range(rangeFrom, rangeTo)

      if (error) throw error
      invitations = data || []
      resourcePagination = buildPaginationMetadata(page, pageSize, count || 0)
    }

    if (resource === 'links') {
      let linksQuery = supabase
        .from('bulk_invite_links')
        .select('id, token, name, role, max_uses, current_uses, expires_at, created_at, created_by, status', { count: 'exact' })
        .eq('organization_id', auth.organizationId)

      if (search) {
        const escapedSearch = search.replace(/[%_]/g, '\\$&')
        linksQuery = linksQuery.or(
          `name.ilike.%${escapedSearch}%,role.ilike.%${escapedSearch}%,status.ilike.%${escapedSearch}%,token.ilike.%${escapedSearch}%`,
        )
      }

      const { data, error, count } = await linksQuery
        .order('created_at', { ascending: false })
        .range(rangeFrom, rangeTo)

      if (error) throw error
      inviteLinks = data || []
      resourcePagination = buildPaginationMetadata(page, pageSize, count || 0)
    }

    return NextResponse.json({
      success: true,
      resource,
      users: usersPage.users || [],
      stats: stats || {},
      invitations,
      inviteLinks,
      pagination: resourcePagination,
      totals: {
        users: usersCountResult.count || 0,
        invitations: invitationsCountResult.count || 0,
        inviteLinks: inviteLinksCountResult.count || 0,
      },
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
    const errorMessage = error instanceof Error ? error.message : String(error)
    logger.error('Error in /api/[orgSlug]/business/users GET:', {
      message: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
    })
    return NextResponse.json(
      { success: false, error: 'Error al obtener usuarios de la organización' },
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
      date_of_birth: body.date_of_birth,
      gender: body.gender,
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
