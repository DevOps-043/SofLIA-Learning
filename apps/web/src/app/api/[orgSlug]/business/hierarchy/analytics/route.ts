import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { requireBusiness } from '@/lib/auth/requireBusiness'
import { logger } from '@/lib/utils/logger'

interface RouteContext {
  params: Promise<{ orgSlug: string }>;
}

/**
 * GET /api/[orgSlug]/business/hierarchy/analytics
 */
export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const { orgSlug } = await params;
    const auth = await requireBusiness({ organizationSlug: orgSlug });
    if (auth instanceof NextResponse) return auth;

    if (!auth.organizationId) {
      return NextResponse.json(
        { success: false, error: 'No tienes una organización asignada' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const id = searchParams.get('id')

    if (!type || !id || !['region', 'zone', 'team', 'node'].includes(type)) {
      return NextResponse.json(
        { success: false, error: 'Parámetros inválidos. Se requiere type (region|zone|team|node) e id' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    const { data, error } = await supabase.rpc('get_hierarchy_analytics', {
      p_entity_type: type,
      p_entity_id: id
    })

    if (error) {
      return NextResponse.json(
        {
          success: false,
          error: error.message || 'Error al obtener analíticas'
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: { analytics: data }
    })
  } catch (error: any) {
    logger.error('Error inesperado en GET analytics:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
