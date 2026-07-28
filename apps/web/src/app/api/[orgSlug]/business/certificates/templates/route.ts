import { NextRequest, NextResponse } from 'next/server'
import { requireBusiness } from '@/lib/auth/requireBusiness'
import { apiError } from '@/lib/api/errors'
import { withZodBody } from '@/lib/api/with-validation'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'
import { requireFeature } from '@/lib/subscription/subscriptionHelper'
import { SELECT_COLUMNS } from '@/lib/supabase/select-types';
import {
  certificateTemplateCreateSchema,
  certificateTemplateUpdateSchema,
  type CertificateTemplateCreateBody,
  type CertificateTemplateUpdateBody,
} from '../../_schemas'

type RouteContext = {
  params: Promise<{ orgSlug: string }>
}

/**
 * GET /api/[orgSlug]/business/certificates/templates
 * Obtiene los templates de certificados de la organizacion
 */
export async function GET(
  request: NextRequest,
  { params }: RouteContext,
) {
  try {
    const { orgSlug } = await params
    const auth = await requireBusiness({ organizationSlug: orgSlug })
    if (auth instanceof NextResponse) return auth

    if (!auth.organizationId) {
      return NextResponse.json({
        success: false,
        error: 'Usuario no pertenece a ninguna organizacion',
      }, { status: 400 })
    }

    const supabase = await createClient()

    const featureCheck = await requireFeature(auth.organizationId, 'custom_certificates')
    if (featureCheck) {
      return featureCheck
    }

    const { data: templates, error: templatesError } = await supabase
      .from('certificate_templates')
      .select(SELECT_COLUMNS.certificate_templates)
      .eq('organization_id', auth.organizationId)
      .eq('is_active', true)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false })

    if (templatesError) {
      logger.error('Error fetching certificate templates:', templatesError)
      return NextResponse.json({
        success: false,
        error: 'Error al obtener templates de certificados',
      }, { status: 500 })
    }

    if (!templates || templates.length === 0) {
      const defaultTemplate = {
        organization_id: auth.organizationId,
        name: 'Template por Defecto',
        description: 'Template basico con branding de la organizacion',
        design_config: {
          layout: 'modern',
          colors: {
            primary: 'var(--color-secondary)',
            secondary: 'var(--color-legacy-6366f1)',
            text: 'var(--color-legacy-1f2937)',
            background: 'var(--color-bg-light)',
          },
          fonts: {
            title: 'Inter Tight',
            body: 'Inter Tight',
          },
          elements: {
            show_logo: true,
            show_signature: true,
            show_date: true,
            show_code: true,
          },
        },
        is_default: true,
        is_active: true,
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
        default_template: defaultTemplate,
      })
    }

    return NextResponse.json({
      success: true,
      templates: templates || [],
    })
  } catch (error) {
    logger.error('Error in /api/[orgSlug]/business/certificates/templates GET:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor',
    }, { status: 500 })
  }
}

/**
 * POST /api/[orgSlug]/business/certificates/templates
 * Crea un nuevo template de certificado
 */
async function handlePost(
  _request: NextRequest,
  body: CertificateTemplateCreateBody,
  { params }: RouteContext,
) {
  try {
    const { orgSlug } = await params
    const auth = await requireBusiness({ organizationSlug: orgSlug })
    if (auth instanceof NextResponse) return auth

    if (!auth.organizationId) {
      return apiError(
        'NO_ORGANIZATION',
        'Usuario no pertenece a ninguna organizacion',
        400,
      )
    }

    const supabase = await createClient()

    const featureCheck = await requireFeature(auth.organizationId, 'custom_certificates')
    if (featureCheck) {
      return featureCheck
    }

    const { name, description, design_config, is_default } = body

    if (is_default) {
      await supabase
        .from('certificate_templates')
        .update({ is_default: false })
        .eq('organization_id', auth.organizationId)
        .eq('is_default', true)
    }

    const { data: newTemplate, error: createError } = await supabase
      .from('certificate_templates')
      .insert({
        organization_id: auth.organizationId,
        name,
        description: description || null,
        design_config,
        is_default: is_default || false,
        is_active: true,
      })
      .select()
      .single()

    if (createError) {
      logger.error('Error creating certificate template:', createError)
      return apiError(
        'CREATE_CERTIFICATE_TEMPLATE_FAILED',
        'Error al crear template de certificado',
        500,
      )
    }

    return NextResponse.json({
      success: true,
      template: newTemplate,
    }, { status: 201 })
  } catch (error) {
    logger.error('Error in /api/[orgSlug]/business/certificates/templates POST:', error)
    return apiError(
      'CREATE_CERTIFICATE_TEMPLATE_FAILED',
      'Error interno del servidor',
      500,
    )
  }
}

/**
 * PUT /api/[orgSlug]/business/certificates/templates
 * Actualiza un template de certificado existente
 */
async function handlePut(
  request: NextRequest,
  body: CertificateTemplateUpdateBody,
  { params }: RouteContext,
) {
  try {
    const { orgSlug } = await params
    const auth = await requireBusiness({ organizationSlug: orgSlug })
    if (auth instanceof NextResponse) return auth

    if (!auth.organizationId) {
      return apiError(
        'NO_ORGANIZATION',
        'Usuario no pertenece a ninguna organizacion',
        400,
      )
    }

    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const templateId = searchParams.get('id')

    if (!templateId) {
      return apiError('TEMPLATE_ID_REQUIRED', 'ID de template es requerido', 400)
    }

    const { name, description, design_config, is_default, is_active } = body

    const { data: existingTemplate, error: fetchError } = await supabase
      .from('certificate_templates')
      .select('id')
      .eq('id', templateId)
      .eq('organization_id', auth.organizationId)
      .maybeSingle()

    if (fetchError || !existingTemplate) {
      return apiError(
        'CERTIFICATE_TEMPLATE_NOT_FOUND',
        'Template no encontrado o no pertenece a tu organizacion',
        404,
      )
    }

    if (is_default) {
      await supabase
        .from('certificate_templates')
        .update({ is_default: false })
        .eq('organization_id', auth.organizationId)
        .eq('is_default', true)
        .neq('id', templateId)
    }

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
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
      return apiError(
        'UPDATE_CERTIFICATE_TEMPLATE_FAILED',
        'Error al actualizar template de certificado',
        500,
      )
    }

    return NextResponse.json({
      success: true,
      template: updatedTemplate,
    })
  } catch (error) {
    logger.error('Error in /api/[orgSlug]/business/certificates/templates PUT:', error)
    return apiError(
      'UPDATE_CERTIFICATE_TEMPLATE_FAILED',
      'Error interno del servidor',
      500,
    )
  }
}

export const POST = withZodBody(certificateTemplateCreateSchema, handlePost)
export const PUT = withZodBody(certificateTemplateUpdateSchema, handlePut)

/**
 * DELETE /api/[orgSlug]/business/certificates/templates
 * Elimina un template de certificado
 */
export async function DELETE(
  request: NextRequest,
  { params }: RouteContext,
) {
  try {
    const { orgSlug } = await params
    const auth = await requireBusiness({ organizationSlug: orgSlug })
    if (auth instanceof NextResponse) return auth

    if (!auth.organizationId) {
      return NextResponse.json({
        success: false,
        error: 'Usuario no pertenece a ninguna organizacion',
      }, { status: 400 })
    }

    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const templateId = searchParams.get('id')

    if (!templateId) {
      return NextResponse.json({
        success: false,
        error: 'ID de template es requerido',
      }, { status: 400 })
    }

    const { data: existingTemplate } = await supabase
      .from('certificate_templates')
      .select('id, is_default')
      .eq('id', templateId)
      .eq('organization_id', auth.organizationId)
      .maybeSingle()

    if (!existingTemplate) {
      return NextResponse.json({
        success: false,
        error: 'Template no encontrado o no pertenece a tu organizacion',
      }, { status: 404 })
    }

    if (existingTemplate.is_default) {
      return NextResponse.json({
        success: false,
        error: 'No se puede eliminar el template por defecto',
      }, { status: 400 })
    }

    const { error: deleteError } = await supabase
      .from('certificate_templates')
      .update({ is_active: false })
      .eq('id', templateId)
      .eq('organization_id', auth.organizationId)

    if (deleteError) {
      logger.error('Error deleting certificate template:', deleteError)
      return NextResponse.json({
        success: false,
        error: 'Error al eliminar template de certificado',
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Template eliminado exitosamente',
    })
  } catch (error) {
    logger.error('Error in /api/[orgSlug]/business/certificates/templates DELETE:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor',
    }, { status: 500 })
  }
}
