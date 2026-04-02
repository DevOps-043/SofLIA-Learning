import { NextResponse } from 'next/server'
import { requireAdmin } from '../../../../../lib/auth/requireAdmin'
import { createClient } from '../../../../../lib/supabase/server'
import { fromLoose } from '../../../../../lib/supabase/looseQuery'
import { logger } from '../../../../../lib/utils/logger'

type AccessRequestStatus = 'pending' | 'approved' | 'rejected'

interface AccessRequestRow {
  id: string
  community_id: string
  requester_id: string
  status: AccessRequestStatus | string
  note?: string | null
  created_at: string
  reviewed_at?: string | null
}

interface CommunityLookupRow {
  id: string
  name: string | null
  slug: string | null
}

interface RequesterLookupRow {
  id: string
  username?: string | null
  email?: string | null
  first_name?: string | null
  last_name?: string | null
}

function accessRequestsTable(client: unknown) {
  return fromLoose<AccessRequestRow>(client, 'community_access_requests')
}

function communitiesTable(client: unknown) {
  return fromLoose<CommunityLookupRow>(client, 'communities')
}

function requestersTable(client: unknown) {
  return fromLoose<RequesterLookupRow>(client, 'usuarios')
}

export async function GET() {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth

  try {
    const supabase = await createClient()
    const { data: requests, error: requestsError } = await accessRequestsTable(
      supabase,
    )
      .select(
        'id, community_id, requester_id, status, note, created_at, reviewed_at',
      )
      .order('created_at', { ascending: false })

    if (requestsError) {
      logger.error('Error fetching access requests:', requestsError)
      return NextResponse.json(
        { error: 'Error al obtener solicitudes' },
        { status: 500 },
      )
    }

    const requestRows = requests ?? []
    const communityIds = Array.from(
      new Set(
        requestRows
          .map((request) => request.community_id)
          .filter((communityId): communityId is string => Boolean(communityId)),
      ),
    )
    const requesterIds = Array.from(
      new Set(
        requestRows
          .map((request) => request.requester_id)
          .filter((requesterId): requesterId is string => Boolean(requesterId)),
      ),
    )

    const { data: communities, error: communitiesError } =
      communityIds.length > 0
        ? await communitiesTable(supabase)
            .select('id, name, slug')
            .in('id', communityIds)
        : { data: [], error: null }

    if (communitiesError) {
      logger.error(
        'Error fetching communities for access requests:',
        communitiesError,
      )
      return NextResponse.json(
        { error: 'Error al obtener comunidades relacionadas' },
        { status: 500 },
      )
    }

    const { data: requesters, error: requestersError } =
      requesterIds.length > 0
        ? await requestersTable(supabase)
            .select('id, username, email, first_name, last_name')
            .in('id', requesterIds)
        : { data: [], error: null }

    if (requestersError) {
      logger.error(
        'Error fetching requesters for access requests:',
        requestersError,
      )
      return NextResponse.json(
        { error: 'Error al obtener solicitantes relacionados' },
        { status: 500 },
      )
    }

    const communitiesById = new Map(
      (communities ?? []).map((community) => [community.id, community]),
    )
    const requestersById = new Map(
      (requesters ?? []).map((requester) => [requester.id, requester]),
    )

    const hydratedRequests = requestRows.map((request) => {
      const community = communitiesById.get(request.community_id)
      const requester = requestersById.get(request.requester_id)

      return {
        ...request,
        community: {
          name: community?.name ?? 'Comunidad sin nombre',
          slug: community?.slug ?? '',
        },
        requester: {
          username: requester?.username ?? 'usuario-desconocido',
          email: requester?.email ?? '',
          first_name: requester?.first_name ?? undefined,
          last_name: requester?.last_name ?? undefined,
        },
      }
    })

    const stats = {
      totalRequests: hydratedRequests.length,
      totalPending: hydratedRequests.filter(
        (request) => request.status === 'pending',
      ).length,
      totalApproved: hydratedRequests.filter(
        (request) => request.status === 'approved',
      ).length,
      totalRejected: hydratedRequests.filter(
        (request) => request.status === 'rejected',
      ).length,
    }

    return NextResponse.json({
      requests: hydratedRequests,
      stats,
    })
  } catch (error) {
    logger.error('Error in admin access requests API:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 },
    )
  }
}
