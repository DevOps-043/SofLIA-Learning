import { NextRequest, NextResponse } from 'next/server'
import { requireBusiness } from '@/lib/auth/requireBusiness'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'
import { requireFeature } from '@/lib/subscription/subscriptionHelper'

/**
 * GET /api/business/certificates/templates
 * Obtiene los templates de certificados de la organización
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireBusiness()
    if (auth instanceof NextResponse) return auth

    if (!auth.organizationId) {
      return NextResponse.json({
        success: false,
        error: 'Usuario no pertenece a ninguna organización'
      }, { status: 400 })
    }

    const supabase = await createClient()

    // Verificar que el plan permite certificados personalizados (solo Enterprise según tablas)
    const featureCheck = await requireFeature(auth.organizationId, 'custom_certificates')
    if (featureCheck) {
      return featureCheck
    }

    // Obtener templates de la organización
    const { data: templates, error: templatesError } = await supabase
      .from('certificate_templates')
      .select('*')
      .eq('organization_id', auth.organizationId)
      .eq('is_active', true)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false })

    if (templatesError) {
      logger.error('Error fetching certificate templates:', templatesError)
      return NextResponse.json({
        success: false,
        error: 'Error al obtener templates de certificados'
      }, { status: 500 })
    }

    // Si no hay templates, crear uno por defecto
    if (!templates || templates.length === 0) {
      const defaultTemplate = {
        organization_id: auth.organizationId,
        name: 'Template por Defecto',
        description: 'Template básico con branding de la organización',
        design_config: {
          layout: 'modern',
          colors: {
            primary: '#8b5cf6',
            secondary: '#6366f1',
            text: '#1f2937',
            background: '#ffffff'
          },
          fonts: {
            title: 'Inter',
            body: 'Inter'
          },
          elements: {
            show_logo: true,
            show_signature: true,
            show_date: true,
            show_code: true
          }
        },
        is_default: true,
        is_active: true
      }

      const { data: newTemplate, error: createError } = await supabase
        .from('certificate_templates')
        .insert(defaultTemplate)
        .select()
        .single()

      if (createError) {
        logger.error('Error creating default template:', createError)
      }

      return NextResponse.json({
        success: true,
        templates: newTemplate ? [newTemplate] : [],
        default_template: defaultTemplate
      })
    }

    return NextResponse.json({
      success: true,
      templates: templates || []
    })
  } catch (error) {
    logger.error('💥 Error in /api/business/certificates/templates GET:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 })
  }
}

/**
 * POST /api/business/certificates/templates
 * Crea un nuevo template de certificado
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await requireBusiness()
    if (auth instanceof NextResponse) return auth

    if (!auth.organizationId) {
      return NextResponse.json({
        success: false,
        error: 'Usuario no pertenece a ninguna organización'
      }, { status: 400 })
    }

    const supabase = await createClient()

    // Verificar que el plan permite certificados personalizados (solo Enterprise según tablas)
    const featureCheck = await requireFeature(auth.organizationId, 'custom_certificates')
    if (featureCheck) {
      return featureCheck
    }

    const body = await request.json()
    const { name, description, design_config, is_default } = body

    if (!name || !design_config) {
      return NextResponse.json({
        success: false,
        error: 'Nombre y configuración de diseño son requeridos'
      }, { status: 400 })
    }

    // Si es el template por defecto, desmarcar otros templates por defecto
    if (is_default) {
      await supabase
        .from('certificate_templates')
        .update({ is_default: false })
        .eq('organization_id', auth.organizationId)
        .eq('is_default', true)
    }

    // Crear nuevo template
    const { data: newTemplate, error: createError } = await supabase
      .from('certificate_templates')
      .insert({
        organization_id: auth.organizationId,
        name,
        description: description || null,
        design_config,
        is_default: is_default || false,
        is_active: true
      })
      .select()
      .single()

    if (createError) {
      logger.error('Error creating certificate template:', createError)
      return NextResponse.json({
        success: false,
        error: 'Error al crear template de certificado'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      template: newTemplate
    }, { status: 201 })
  } catch (error) {
    logger.error('💥 Error in /api/business/certificates/templates POST:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 })
  }
}

/**
 * PUT /api/business/certificates/templates/[id]
 * Actualiza un template de certificado existente
 */
export async function PUT(request: NextRequest) {
  try {
    const auth = await requireBusiness()
    if (auth instanceof NextResponse) return auth

    if (!auth.organizationId) {
      return NextResponse.json({
        success: false,
        error: 'Usuario no pertenece a ninguna organización'
      }, { status: 400 })
    }

    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const templateId = searchParams.get('id')

    if (!templateId) {
      return NextResponse.json({
        success: false,
        error: 'ID de template es requerido'
      }, { status: 400 })
    }

    const body = await request.json()
    const { name, description, design_config, is_default, is_active } = body

    // Verificar que el template pertenece a la organización
    const { data: existingTemplate, error: fetchError } = await supabase
      .from('certificate_templates')
      .select('id')
      .eq('id', templateId)
      .eq('organization_id', auth.organizationId)
      .maybeSingle()

    if (fetchError || !existingTemplate) {
      return NextResponse.json({
        success: false,
        error: 'Template no encontrado o no pertenece a tu organización'
      }, { status: 404 })
    }

    // Si es el template por defecto, desmarcar otros
    if (is_default) {
      await supabase
        .from('certificate_templates')
        .update({ is_default: false })
        .eq('organization_id', auth.organizationId)
        .eq('is_default', true)
        .neq('id', templateId)
    }

    // Actualizar template
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString()
    }

    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (design_config !== undefined) updateData.design_config = design_config
    if (is_default !== undefined) updateData.is_default = is_default
    if (is_active !== undefined) updateData.is_active = is_active

    const { data: updatedTemplate, error: updateError } = await supabase
      .from('certificate_templates')
      .update(updateData)
      .eq('id', templateId)
      .eq('organization_id', auth.organizationId)
      .select()
      .single()

    if (updateError) {
      logger.error('Error updating certificate template:', updateError)
      return NextResponse.json({
        success: false,
        error: 'Error al actualizar template de certificado'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      template: updatedTemplate
    })
  } catch (error) {
    logger.error('💥 Error in /api/business/certificates/templates PUT:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 })
  }
}

/**
 * DELETE /api/business/certificates/templates/[id]
 * Elimina un template de certificado
 */
export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireBusiness()
    if (auth instanceof NextResponse) return auth

    if (!auth.organizationId) {
      return NextResponse.json({
        success: false,
        error: 'Usuario no pertenece a ninguna organización'
      }, { status: 400 })
    }

    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const templateId = searchParams.get('id')

    if (!templateId) {
      return NextResponse.json({
        success: false,
        error: 'ID de template es requerido'
      }, { status: 400 })
    }

    // Verificar que el template pertenece a la organización
    const { data: existingTemplate } = await supabase
      .from('certificate_templates')
      .select('id, is_default')
      .eq('id', templateId)
      .eq('organization_id', auth.organizationId)
      .maybeSingle()

    if (!existingTemplate) {
      return NextResponse.json({
        success: false,
        error: 'Template no encontrado o no pertenece a tu organización'
      }, { status: 404 })
    }

    // No permitir eliminar template por defecto
    if (existingTemplate.is_default) {
      return NextResponse.json({
        success: false,
        error: 'No se puede eliminar el template por defecto'
      }, { status: 400 })
    }

    // Marcar como inactivo en vez de eliminar (soft delete)
    const { error: deleteError } = await supabase
      .from('certificate_templates')
      .update({ is_active: false })
      .eq('id', templateId)
      .eq('organization_id', auth.organizationId)

    if (deleteError) {
      logger.error('Error deleting certificate template:', deleteError)
      return NextResponse.json({
        success: false,
        error: 'Error al eliminar template de certificado'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Template eliminado exitosamente'
    })
  } catch (error) {
    logger.error('💥 Error in /api/business/certificates/templates DELETE:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 })
  }
}

