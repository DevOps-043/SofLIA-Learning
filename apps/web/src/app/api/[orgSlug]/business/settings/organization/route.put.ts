import { NextRequest, NextResponse } from 'next/server'

import { requireBusiness } from '@/lib/auth/requireBusiness'

import { createClient } from '@/lib/supabase/server'

import { logger } from '@/lib/utils/logger'

/**
 * PUT /api/[orgSlug]/business/settings/organization
 * Actualiza los datos de la organización activa
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ orgSlug: string }> }
) {
  try {
    const { orgSlug } = await params
    const auth = await requireBusiness({ organizationSlug: orgSlug })
    if (auth instanceof NextResponse) return auth

    if (!auth.organizationId) {
      return NextResponse.json({
        success: false,
        error: 'No tienes una organización asignada'
      }, { status: 403 })
    }

    const supabase = await createClient()
    
    // Verificar permisos de admin/owner
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
      slug: newSlug
    } = body

    // Preparar actualizaciones
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString()
    }

    if (name !== undefined) {
      if (name.trim().length === 0) {
        return NextResponse.json({ success: false, error: 'El nombre es requerido' }, { status: 400 })
      }
      updateData.name = name.trim()
    }

    if (description !== undefined) updateData.description = description?.trim() || null
    if (contact_email !== undefined) updateData.contact_email = contact_email?.trim() || null
    if (contact_phone !== undefined) updateData.contact_phone = contact_phone?.trim() || null
    if (website_url !== undefined) updateData.website_url = website_url?.trim() || null
    if (logo_url !== undefined) updateData.logo_url = logo_url?.trim() || null
    
    // Si se intenta cambiar el slug
    if (newSlug !== undefined && newSlug !== null && newSlug.trim() !== '' && newSlug !== orgSlug) {
      const slugValue = newSlug.trim().toLowerCase()
      
      if (!/^[a-z0-9-]+$/.test(slugValue)) {
        return NextResponse.json({ success: false, error: 'Formato de slug inválido' }, { status: 400 })
      }

      // Verificar disponibilidad
      const { data: existingOrg } = await supabase
        .from('organizations')
        .select('id')
        .ilike('slug', slugValue)
        .neq('id', auth.organizationId)
        .single()

      if (existingOrg) {
        return NextResponse.json({ success: false, error: 'Este identificador ya está en uso' }, { status: 400 })
      }
      updateData.slug = slugValue
    }

    if (max_users !== undefined) {
      const maxUsersNum = parseInt(max_users)
      if (isNaN(maxUsersNum) || maxUsersNum < 1) {
        return NextResponse.json({ success: false, error: 'Número de usuarios inválido' }, { status: 400 })
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
      return NextResponse.json({ success: false, error: 'Error al actualizar' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      organization: updatedOrganization
    })
  } catch (error) {
    logger.error('💥 Error in PUT /api/[orgSlug]/business/settings/organization:', error)
    return NextResponse.json({ success: false, error: 'Error interno' }, { status: 500 })
  }
}
