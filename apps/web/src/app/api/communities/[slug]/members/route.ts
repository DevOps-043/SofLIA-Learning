import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { formatApiError, logError } from '@/core/utils/api-errors'
import {
  cleanupInvalidProfesionalesMemberships,
  getCommunityMembersPayload,
  getCurrentSessionUser,
} from './community-members'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const user = await getCurrentSessionUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const supabase = await createClient()
    const { slug } = await params
    const result = await getCommunityMembersPayload(supabase, slug)
    return NextResponse.json(result.body, { status: result.status })
  } catch (error) {
    logError('GET /api/communities/[slug]/members', error)
    return NextResponse.json(
      formatApiError(error, 'Error al obtener miembros de la comunidad'),
      { status: 500 },
    )
  }
}

export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const user = await getCurrentSessionUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const supabase = await createClient()
    const { slug } = await params
    const result = await cleanupInvalidProfesionalesMemberships(supabase, slug, user.id)
    return NextResponse.json(result.body, { status: result.status })
  } catch (error) {
    logError('PATCH /api/communities/[slug]/members', error)
    return NextResponse.json(formatApiError(error, 'Error al limpiar membresias'), { status: 500 })
  }
}
