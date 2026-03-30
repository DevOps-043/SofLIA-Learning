import { NextRequest, NextResponse } from 'next/server'
import { AdminCommunitiesService } from '@/features/admin/services/adminCommunities.service'
import { requireAdmin } from '@/lib/auth/requireAdmin'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // ✅ SEGURIDAD: Verificar autenticación y autorización de admin
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth
    
    const { id: communityId } = await params
    const adminUserId = auth.userId
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    const updatedCommunity = await AdminCommunitiesService.toggleCommunityVisibility(
      communityId,
      adminUserId,
      { ip, userAgent }
    )

    return NextResponse.json({ 
      success: true, 
      community: updatedCommunity 
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error al cambiar visibilidad de la comunidad';
    return NextResponse.json({ 
      success: false, 
      message 
    }, { status: 500 })
  }
}
