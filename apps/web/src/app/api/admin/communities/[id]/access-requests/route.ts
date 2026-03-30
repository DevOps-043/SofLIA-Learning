import { NextRequest, NextResponse } from 'next/server'
import { AdminCommunitiesService } from '@/features/admin/services/adminCommunities.service'
import { requireInstructor } from '@/lib/auth/requireAdmin'
import { canManageCommunityAccessRequests } from '@/lib/auth/communityPermissions'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Permitir tanto Administradores como Instructores
    const auth = await requireInstructor()
    if (auth instanceof NextResponse) return auth
    
    const { id: communityId } = await params

    // Validar que el usuario puede gestionar solicitudes de esta comunidad
    const canManage = await canManageCommunityAccessRequests(auth.userId, communityId)
    if (!canManage) {
      return NextResponse.json({ 
        success: false, 
        message: 'No tienes permisos para ver solicitudes de esta comunidad. Solo los Administradores o los Instructores que son admin/creadores de la comunidad pueden hacerlo.',
        requests: []
      }, { status: 403 })
    }

    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = parseInt(url.searchParams.get('limit') || '10')

    const requests = await AdminCommunitiesService.getCommunityAccessRequests(communityId, page, limit)

    return NextResponse.json({ 
      success: true, 
      requests 
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error al obtener las solicitudes';
    return NextResponse.json({ 
      success: false, 
      message 
    }, { status: 500 })
  }
}
