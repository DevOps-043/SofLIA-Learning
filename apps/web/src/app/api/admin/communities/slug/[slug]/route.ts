import { NextRequest, NextResponse } from 'next/server'
import { AdminCommunitiesService } from '@/features/admin/services/adminCommunities.service'
import { requireAdmin } from '@/lib/auth/requireAdmin'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth
    
    const { slug } = await params
    const community = await AdminCommunitiesService.getCommunityBySlug(slug)

    if (!community) {
      return NextResponse.json({ 
        success: false, 
        message: 'Comunidad no encontrada' 
      }, { status: 404 })
    }

    return NextResponse.json({ 
      success: true, 
      community 
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error al obtener la comunidad';
    return NextResponse.json({ 
      success: false, 
      message 
    }, { status: 500 })
  }
}
