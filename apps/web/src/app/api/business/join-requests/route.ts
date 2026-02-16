import { NextResponse } from 'next/server'
import { requireBusiness } from '@/lib/auth/requireBusiness'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'

export async function GET() {
  const auth = await requireBusiness()
  if (auth instanceof NextResponse) return auth

  try {
    if (!auth.isOrgAdmin) {
      return NextResponse.json(
        { success: false, error: 'Se requiere rol de administrador u owner.' },
        { status: 403 }
      )
    }

    if (!auth.organizationId) {
      return NextResponse.json(
        { success: false, error: 'No se encontró organización.' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Fetch join requests
    const { data: requests, error } = await supabase
      .from('organization_join_requests')
      .select('id, user_id, status, message, job_title, created_at, updated_at')
      .eq('organization_id', auth.organizationId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    if (error) {
      logger.error('Error fetching join requests:', error)
      return NextResponse.json(
        { success: false, error: 'Error al obtener las solicitudes.' },
        { status: 500 }
      )
    }

    if (!requests || requests.length === 0) {
      return NextResponse.json({ success: true, requests: [], count: 0 })
    }

    // Fetch user details for each request
    const userIds = requests.map((r) => r.user_id)
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, first_name, last_name, email, username, profile_picture_url')
      .in('id', userIds)

    if (usersError) {
      logger.error('Error fetching users for join requests:', usersError)
    }

    const usersMap = new Map((users || []).map((u) => [u.id, u]))

    const enrichedRequests = requests.map((r) => ({
      id: r.id,
      status: r.status,
      message: r.message,
      job_title: r.job_title,
      created_at: r.created_at,
      updated_at: r.updated_at,
      user: usersMap.get(r.user_id) || null,
    }))

    return NextResponse.json({
      success: true,
      requests: enrichedRequests,
      count: enrichedRequests.length,
    })
  } catch (error) {
    logger.error('Error in GET /api/business/join-requests:', error instanceof Error ? error : undefined)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor.' },
      { status: 500 }
    )
  }
}
