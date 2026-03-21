import { NextRequest, NextResponse } from 'next/server'
import { requireBusiness } from '@/lib/auth/requireBusiness'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/[orgSlug]/business/settings/check-slug
 * Verifica si un slug está disponible para usar para la organización activa
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orgSlug: string }> }
) {
  try {
    const { orgSlug } = await params
    const auth = await requireBusiness({ organizationSlug: orgSlug })
    if (auth instanceof NextResponse) return auth

    if (!auth.organizationId) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const slugToCheck = searchParams.get('slug')

    if (!slugToCheck) {
      return NextResponse.json({ success: false, error: 'Slug requerido' }, { status: 400 })
    }

    // Validar formato
    if (!/^[a-z0-9-]+$/.test(slugToCheck) || slugToCheck.length < 3 || slugToCheck.length > 50) {
      return NextResponse.json({ success: false, error: 'Formato de slug inválido' }, { status: 400 })
    }

    const supabase = await createClient()
    
    // Verificar si el slug ya está en uso por OTRA organización
    const { data: existingOrg, error } = await supabase
      .from('organizations')
      .select('id')
      .ilike('slug', slugToCheck)
      .neq('id', auth.organizationId)
      .maybeSingle()

    if (error) {
      console.error('Error checking slug:', error)
      return NextResponse.json({ success: false, error: 'Error al verificar' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      available: !existingOrg,
      slug: slugToCheck
    })

  } catch (error) {
    console.error('Error in GET /api/[orgSlug]/business/settings/check-slug:', error)
    return NextResponse.json({ success: false, error: 'Error interno' }, { status: 500 })
  }
}
