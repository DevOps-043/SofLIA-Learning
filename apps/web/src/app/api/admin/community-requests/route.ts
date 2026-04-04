import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { logger } from '@/lib/utils/logger'
import { createClient } from '@/lib/supabase/server'

interface CommunityRequester {
  id: string
  display_name: string | null
  first_name: string | null
  last_name: string | null
  email: string | null
  profile_picture_url: string | null
  cargo_rol: string | null
}

interface CommunityReviewer {
  id: string
  display_name: string | null
  first_name: string | null
  last_name: string | null
  email: string | null
}

interface CommunityCourse {
  id: string
  title: string | null
  slug: string | null
  thumbnail_url: string | null
}

interface CommunityRequestRow {
  id: string
  requester_id: string
  requester: CommunityRequester | null
  name: string
  description: string | null
  slug: string
  image_url: string | null
  visibility: string | null
  access_type: string | null
  course_id: string | null
  course: CommunityCourse | null
  status: 'pending' | 'approved' | 'rejected'
  requester_note: string | null
  rejection_reason: string | null
  reviewed_by: string | null
  reviewer: CommunityReviewer | null
  reviewed_at: string | null
  created_at: string
  updated_at: string
}

interface MappedCommunityRequest {
  id: string
  requester_id: string
  requester: {
    id: string
    display_name: string
    email: string | null
    profile_picture_url: string | null
    role: string | null
  } | null
  name: string
  description: string | null
  slug: string
  image_url: string | null
  visibility: string | null
  access_type: string | null
  course_id: string | null
  course: CommunityCourse | null
  status: CommunityRequestRow['status']
  requester_note: string | null
  rejection_reason: string | null
  reviewed_by: string | null
  reviewer: {
    id: string
    display_name: string
    email: string | null
  } | null
  reviewed_at: string | null
  created_at: string
  updated_at: string
}

function formatDisplayName(
  displayName: string | null,
  firstName: string | null,
  lastName: string | null,
  fallback: string,
): string {
  return displayName || `${firstName || ''} ${lastName || ''}`.trim() || fallback
}

// ✅ GET: Listar todas las solicitudes de creación de comunidades
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth
    
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') // 'pending', 'approved', 'rejected', o null para todas

    logger.log('🔄 Obteniendo solicitudes de comunidades, status:', status || 'all')

    let query = supabase
      .from('community_creation_requests')
      .select(`
        *,
        requester:users!community_creation_requests_requester_id_fkey(
          id,
          display_name,
          first_name,
          last_name,
          email,
          profile_picture_url,
          cargo_rol
        ),
        reviewer:users!community_creation_requests_reviewed_by_fkey(
          id,
          display_name,
          first_name,
          last_name,
          email
        ),
        course:courses(
          id,
          title,
          slug,
          thumbnail_url
        )
      `)
      .order('created_at', { ascending: false })

    if (status && ['pending', 'approved', 'rejected'].includes(status)) {
      query = query.eq('status', status)
    }

    const { data: requests, error } = await query

    if (error) {
      logger.error('❌ Error fetching community requests:', error)
      return NextResponse.json(
        { 
          success: false,
          error: 'Error al obtener las solicitudes'
        },
        { status: 500 }
      )
    }

    // Mapear datos
    const mappedRequests: MappedCommunityRequest[] = ((requests || []) as CommunityRequestRow[]).map((request) => ({
      id: request.id,
      requester_id: request.requester_id,
      requester: request.requester ? {
        id: request.requester.id,
        display_name: formatDisplayName(
          request.requester.display_name,
          request.requester.first_name,
          request.requester.last_name,
          'Usuario sin nombre',
        ),
        email: request.requester.email,
        profile_picture_url: request.requester.profile_picture_url,
        role: request.requester.cargo_rol
      } : null,
      name: request.name,
      description: request.description,
      slug: request.slug,
      image_url: request.image_url,
      visibility: request.visibility,
      access_type: request.access_type,
      course_id: request.course_id,
      course: request.course || null,
      status: request.status,
      requester_note: request.requester_note,
      rejection_reason: request.rejection_reason,
      reviewed_by: request.reviewed_by,
      reviewer: request.reviewer ? {
        id: request.reviewer.id,
        display_name: formatDisplayName(
          request.reviewer.display_name,
          request.reviewer.first_name,
          request.reviewer.last_name,
          'Administrador',
        ),
        email: request.reviewer.email
      } : null,
      reviewed_at: request.reviewed_at,
      created_at: request.created_at,
      updated_at: request.updated_at
    }))

    logger.log('✅ Solicitudes obtenidas exitosamente:', mappedRequests.length)
    
    return NextResponse.json({
      success: true,
      requests: mappedRequests,
      counts: {
        total: mappedRequests.length,
        pending: mappedRequests.filter((request) => request.status === 'pending').length,
        approved: mappedRequests.filter((request) => request.status === 'approved').length,
        rejected: mappedRequests.filter((request) => request.status === 'rejected').length
      }
    }, { status: 200 })
  } catch (error) {
    logger.error('💥 Error fetching community requests:', error)
    return NextResponse.json(
      { 
        success: false,
        message: 'Error al obtener las solicitudes',
        error: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    )
  }
}
