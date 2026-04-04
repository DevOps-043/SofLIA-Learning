import { NextRequest, NextResponse } from 'next/server'
import { requireBusiness } from '@/lib/auth/requireBusiness'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'

interface OrganizationUpdatePayload {
  updated_at: string
  name?: string
  description?: string | null
  contact_email?: string | null
  contact_phone?: string | null
  website_url?: string | null
  logo_url?: string | null
  slug?: string | null
  max_users?: number
  google_login_enabled?: boolean
  microsoft_login_enabled?: boolean
}

/**
 * GET /api/business/settings/organization
 * Obtiene los datos de la organización del usuario autenticado
 */
export async function GET() {
  try {
    const auth = await requireBusiness()
    if (auth instanceof NextResponse) return auth

    if (!auth.organizationId) {
      return NextResponse.json({
        success: false,
        error: 'No tienes una organización asignada'
      }, { status: 403 })
    }

    const supabase = await createClient()
    const organizationId = auth.organizationId

    const { data: organization, error } = await supabase
      .from('organizations')
      .select('*, slug, brand_favicon_url, brand_logo_url')
      .eq('id', organizationId)
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

    return NextResponse.json({
      success: true,
      organization
    })
  } catch (error) {
    logger.error('💥 Error in /api/business/settings/organization:', error)
    return NextResponse.json({
      success: false,
      error: 'Error al obtener datos de la organización'
    }, { status: 500 })
  }
}

/**
 * PUT /api/business/settings/organization
 * Actualiza los datos de la organización
 */
export async function PUT(request: NextRequest) {
  try {
    const auth = await requireBusiness()
    if (auth instanceof NextResponse) return auth

    if (!auth.organizationId) {
      return NextResponse.json({
        success: false,
        error: 'No tienes una organización asignada'
      }, { status: 403 })
    }

    // Verificar que el usuario tenga permisos de owner o admin
    const supabase = await createClient()
    const { data: orgUser, error: orgUserError } = await supabase
      .from('organization_users')
      .select('role')
      .eq('organization_id', auth.organizationId)
      .eq('user_id', auth.userId)
      .single()

    if (orgUserError || !orgUser) {
      return NextResponse.json({
        success: false,
        error: 'No tienes permisos para actualizar la organización'
      }, { status: 403 })
    }

    if (orgUser.role !== 'owner' && orgUser.role !== 'admin') {
      return NextResponse.json({
        success: false,
        error: 'Solo los administradores pueden actualizar la organización'
      }, { status: 403 })
    }

    const body = await request.json()
    const {
      name,
      description,
      contact_email,
      contact_phone,
      website_url,
      logo_url,
      max_users,
      slug
    } = body

    // Validar campos requeridos
    if (name && name.trim().length === 0) {
      return NextResponse.json({
        success: false,
        error: 'El nombre de la organización es requerido'
      }, { status: 400 })
    }

    // Validar y verificar slug si se proporciona
    if (slug !== undefined && slug !== null && slug.trim() !== '') {
      const slugValue = slug.trim().toLowerCase()
      
      // Validar formato
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
    const updateData: OrganizationUpdatePayload = {
      updated_at: new Date().toISOString()
    }

    if (name !== undefined) updateData.name = name.trim()
    if (description !== undefined) updateData.description = description?.trim() || null
    if (contact_email !== undefined) updateData.contact_email = contact_email?.trim() || null
    if (contact_phone !== undefined) updateData.contact_phone = contact_phone?.trim() || null
    if (website_url !== undefined) updateData.website_url = website_url?.trim() || null
    if (logo_url !== undefined) updateData.logo_url = logo_url?.trim() || null
    if (slug !== undefined) updateData.slug = slug?.trim().toLowerCase() || null
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

    if (body.google_login_enabled !== undefined) updateData.google_login_enabled = body.google_login_enabled
    if (body.microsoft_login_enabled !== undefined) updateData.microsoft_login_enabled = body.microsoft_login_enabled

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
    logger.error('💥 Error in PUT /api/business/settings/organization:', error)
    return NextResponse.json({
      success: false,
      error: 'Error al actualizar la organización'
    }, { status: 500 })
  }
}
