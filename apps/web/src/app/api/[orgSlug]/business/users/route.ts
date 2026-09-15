import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/utils/logger'
import { BusinessUsersServerService } from '@/features/business-panel/services/businessUsers.server.service'
import { requireBusiness } from '@/lib/auth/requireBusiness'
import { apiError } from '@/lib/api/errors'
import { withZodBody } from '@/lib/api/with-validation'
import { CreateBusinessUserRequest } from '@/features/business-panel/services/businessUsers.service'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  buildPaginationMetadata,
  parsePaginationParams,
} from '@/lib/api/pagination'
import {
  createBusinessUserSchema,
  type CreateBusinessUserBody,
} from '../_schemas'

type RouteContext = {
  params: Promise<{ orgSlug: string }>
}

type UsersResource = 'users' | 'invitations' | 'links'

function getResource(value: string | null): UsersResource {
  if (value === 'invitations' || value === 'links') return value
  return 'users'
}

export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const { orgSlug } = await params

    const auth = await requireBusiness({ organizationSlug: orgSlug })
    if (auth instanceof NextResponse) return auth

    if (!auth.organizationId) {
      return NextResponse.json(
        { success: false, error: 'No tienes una organizacion asignada' },
        { status: 403 },
      )
    }
    if (!auth.isOrgAdmin) {
      return apiError(
        'FORBIDDEN',
        'No tienes permisos para gestionar usuarios en esta organizacion.',
        403,
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
    // This route has already authorized an organization administrator. The
    // protected invitation tables are intentionally service-role-only.
    const supabase = createAdminClient()

    const [
      usersPage,
      stats,
      usersCountResult,
      invitationsCountResult,
      inviteLinksCountResult,
      { data: orgInfo },
    ] = await Promise.all([
      resource === 'users'
        ? BusinessUsersServerService.getOrganizationUsersPage(
            auth.organizationId,
            {
              page,
              pageSize,
              search,
              role,
              status,
            },
          )
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
        .single(),
    ])

    let invitations: unknown[] = []
    let inviteLinks: unknown[] = []
    let resourcePagination = usersPage.pagination

    if (resource === 'invitations') {
      let invitationsQuery = supabase
        .from('user_invitations')
        .select('id, email, role, status, created_at, expires_at, metadata', {
          count: 'exact',
        })
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
        .select(
          'id, token, name, role, max_uses, current_uses, expires_at, created_at, created_by, status',
          { count: 'exact' },
        )
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

    return NextResponse.json(
      {
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
          logo_url: orgInfo?.brand_logo_url || orgInfo?.logo_url || null,
        },
      },
      {
        headers: {
          'Cache-Control': 'private, no-cache, no-store, must-revalidate',
        },
      },
    )
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    logger.error('Error in /api/[orgSlug]/business/users GET:', {
      message: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
    })
    return NextResponse.json(
      { success: false, error: 'Error al obtener usuarios de la organizacion' },
      { status: 500 },
    )
  }
}

async function handlePost(
  _request: NextRequest,
  body: CreateBusinessUserBody,
  { params }: RouteContext,
) {
  try {
    const { orgSlug } = await params

    const auth = await requireBusiness({ organizationSlug: orgSlug })
    if (auth instanceof NextResponse) return auth

    if (!auth.organizationId) {
      return apiError(
        'NO_ORGANIZATION',
        'No tienes una organizacion asignada',
        403,
      )
    }

    if (!auth.isOrgAdmin) {
      logger.warn('Member attempted to create user - access denied', {
        userId: auth.userId,
        orgSlug,
        organizationRole: auth.organizationRole,
      })
      return apiError(
        'FORBIDDEN',
        'No tienes permisos para gestionar usuarios en esta organizacion.',
        403,
      )
    }

    const requestedRole = body.org_role || 'member'
    const allowedRoles =
      auth.organizationRole === 'owner'
        ? ['member', 'admin', 'owner']
        : ['member', 'admin']

    if (!allowedRoles.includes(requestedRole)) {
      return apiError(
        'FORBIDDEN_ROLE_ASSIGNMENT',
        `No tienes permisos para asignar el rol '${requestedRole}'.`,
        403,
      )
    }

    const userData: CreateBusinessUserRequest = {
      username: body.username,
      email: body.email,
      password: body.password,
      first_name: body.first_name || undefined,
      last_name: body.last_name || undefined,
      display_name: body.display_name || undefined,
      date_of_birth: body.date_of_birth,
      gender: body.gender,
      job_title: body.job_title,
      org_role: requestedRole,
      send_invitation:
        body.send_invitation !== undefined
          ? body.send_invitation
          : !body.password,
    }

    const newUser = await BusinessUsersServerService.createOrganizationUser(
      auth.organizationId,
      userData,
      auth.userId,
    )

    return NextResponse.json({ success: true, user: newUser })
  } catch (error) {
    logger.error('Error in /api/[orgSlug]/business/users POST:', error)
    return apiError(
      'CREATE_BUSINESS_USER_FAILED',
      error instanceof Error ? error.message : 'Error al crear usuario',
      500,
    )
  }
}

export const POST = withZodBody(createBusinessUserSchema, handlePost)
