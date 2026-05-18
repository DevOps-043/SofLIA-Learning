import { logger as techDebtLogger } from '@/lib/utils/logger'
import { NextRequest, NextResponse } from 'next/server'
import { requireBusiness } from '@/lib/auth/requireBusiness'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/business/settings/check-slug
 * Verifica si un slug está disponible para usar
 */
export async function GET(request: NextRequest) {
  try {
    // Autenticación
    const auth = await requireBusiness()
    if (!auth.success || !auth.organization) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }

    // Obtener slug de los parámetros
    const { searchParams } = new URL(request.url)
    const slug = searchParams.get('slug')

    if (!slug) {
      return NextResponse.json(
        { success: false, error: 'Slug requerido' },
        { status: 400 }
      )
    }

    // Validar formato del slug
    if (!/^[a-z0-9-]+$/.test(slug)) {
      return NextResponse.json(
        { success: false, error: 'Formato de slug inválido' },
        { status: 400 }
      )
    }

    if (slug.length < 3 || slug.length > 50) {
      return NextResponse.json(
        { success: false, error: 'El slug debe tener entre 3 y 50 caracteres' },
        { status: 400 }
      )
    }

    // Verificar si el slug ya está en uso por otra organización
    const supabase = await createClient()
    
    const { data: existingOrg, error } = await supabase
      .from('organizations')
      .select('id')
      .ilike('slug', slug)
      .neq('id', auth.organization.id) // Excluir la propia organización
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = No rows returned
      techDebtLogger.error('Error checking slug:', error)
      return NextResponse.json(
        { success: false, error: 'Error al verificar disponibilidad' },
        { status: 500 }
      )
    }

    // Si se encontró una organización con ese slug, no está disponible
    const available = !existingOrg

    return NextResponse.json({
      success: true,
      available,
      slug
    })

  } catch (error) {
    techDebtLogger.error('Error en GET /api/business/settings/check-slug:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
