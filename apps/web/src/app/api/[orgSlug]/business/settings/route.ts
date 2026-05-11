import { NextRequest, NextResponse } from 'next/server'
import { requireBusiness } from '@/lib/auth/requireBusiness'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'

interface RouteContext {
  params: Promise<{ orgSlug: string }>
}

/**
 * GET /api/[orgSlug]/business/settings
 * Obtiene los datos de la organización especificada por slug
 *
 * IMPORTANTE: Esta API usa el orgSlug de la URL para asegurar
 * que se devuelvan los datos de la organización correcta.
 */
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { orgSlug } = await context.params

    if (!orgSlug) {
      return NextResponse.json({
        success: false,
        error: 'Slug de organización requerido'
      }, { status: 400 })
    }

    // Verificar autenticación y acceso a esta organización específica
    const auth = await requireBusiness({ organizationSlug: orgSlug })
    if (auth instanceof NextResponse) return auth

    const supabase = await createClient()

    // Obtener datos de la organización
    const { data: organization, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('slug', orgSlug)
      .single()

    if (error) {
      logger.error('Error fetching organization:', error)
      return NextResponse.json({
        success: false,
        error: 'Error al obtener datos de la organización'
      }, { status: 500 })
    }

    if (!organization) {
      return NextResponse.json({
        success: false,
        error: 'Organización no encontrada'
      }, { status: 404 })
    }

    // Obtener datos de suscripción
    const { data: subscription } = await supabase
      .from('organization_subscriptions')
      .select('*')
      .eq('organization_id', organization.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    return NextResponse.json({
      success: true,
      organization,
      subscription: subscription || null,
      userRole: auth.organizationRole
    })
  } catch (error) {
    logger.error('💥 Error in GET /api/[orgSlug]/business/settings:', error)
    return NextResponse.json({
      success: false,
      error: 'Error al obtener datos de la organización'
    }, { status: 500 })
  }
}

/**
 * PUT /api/[orgSlug]/business/settings
 * Actualiza los datos de la organización especificada
 */
export async function PUT(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { orgSlug } = await context.params

    if (!orgSlug) {
      return NextResponse.json({
        success: false,
        error: 'Slug de organización requerido'
      }, { status: 400 })
    }

    // Verificar autenticación y acceso a esta organización específica
    const auth = await requireBusiness({ organizationSlug: orgSlug })
    if (auth instanceof NextResponse) return auth

    // Verificar que el usuario sea owner o admin
    if (!auth.isOrgAdmin) {
      return NextResponse.json({
        success: false,
        error: 'Solo los administradores pueden actualizar la organización'
      }, { status: 403 })
    }

    const supabase = await createClient()
    const body = await request.json()

    const {
      name,
      description,
      contact_email,
      contact_phone,
      website_url,
      logo_url,
      max_users,
      slug: newSlug,
      google_login_enabled,
      microsoft_login_enabled,
      show_navbar_name,
      industry,
      company_size,
      company_type,
      company_mission,
      company_country,
    } = body

    // Validar campos requeridos
    if (name !== undefined && name.trim().length === 0) {
      return NextResponse.json({
        success: false,
        error: 'El nombre de la organización es requerido'
      }, { status: 400 })
    }

    // Validar y verificar nuevo slug si se proporciona
    if (newSlug !== undefined && newSlug !== null && newSlug.trim() !== '') {
      const slugValue = newSlug.trim().toLowerCase()

      if (!/^[a-z0-9-]+$/.test(slugValue)) {
        return NextResponse.json({
          success: false,
          error: 'El slug solo puede contener letras minúsculas, números y guiones'
        }, { status: 400 })
      }

      if (slugValue.length < 3 || slugValue.length > 50) {
        return NextResponse.json({
          success: false,
          error: 'El slug debe tener entre 3 y 50 caracteres'
        }, { status: 400 })
      }

      // Verificar que no esté siendo usado por otra organización
      const { data: existingOrg } = await supabase
        .from('organizations')
        .select('id')
        .ilike('slug', slugValue)
        .neq('id', auth.organizationId)
        .single()

      if (existingOrg) {
        return NextResponse.json({
          success: false,
          error: 'Este identificador ya está en uso por otra organización'
        }, { status: 400 })
      }
    }

    // Preparar datos para actualizar
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString()
    }

    if (name !== undefined) updateData.name = name.trim()
    if (description !== undefined) updateData.description = description?.trim() || null
    if (contact_email !== undefined) updateData.contact_email = contact_email?.trim() || null
    if (contact_phone !== undefined) updateData.contact_phone = contact_phone?.trim() || null
    if (website_url !== undefined) updateData.website_url = website_url?.trim() || null
    if (logo_url !== undefined) updateData.logo_url = logo_url?.trim() || null
    if (newSlug !== undefined) updateData.slug = newSlug?.trim().toLowerCase() || null
    if (max_users !== undefined) {
      const maxUsersNum = parseInt(max_users)
      if (isNaN(maxUsersNum) || maxUsersNum < 1) {
        return NextResponse.json({
          success: false,
          error: 'El número máximo de usuarios debe ser mayor a 0'
        }, { status: 400 })
      }
      updateData.max_users = maxUsersNum
    }
    if (google_login_enabled !== undefined) updateData.google_login_enabled = google_login_enabled
    if (microsoft_login_enabled !== undefined) updateData.microsoft_login_enabled = microsoft_login_enabled
    if (show_navbar_name !== undefined) updateData.show_navbar_name = show_navbar_name
    if (industry !== undefined) updateData.industry = industry?.trim() || null
    if (company_size !== undefined) updateData.company_size = company_size?.trim() || null
    if (company_type !== undefined) updateData.company_type = company_type?.trim() || null
    if (company_mission !== undefined) updateData.company_mission = company_mission?.trim() || null
    if (company_country !== undefined) updateData.company_country = company_country?.trim() || null

    const { data: updatedOrganization, error: updateError } = await supabase
      .from('organizations')
      .update(updateData)
      .eq('id', auth.organizationId)
      .select()
      .single()

    if (updateError) {
      logger.error('Error updating organization:', updateError)
      return NextResponse.json({
        success: false,
        error: 'Error al actualizar la organización'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      organization: updatedOrganization
    })
  } catch (error) {
    logger.error('💥 Error in PUT /api/[orgSlug]/business/settings:', error)
    return NextResponse.json({
      success: false,
      error: 'Error al actualizar la organización'
    }, { status: 500 })
  }
}
