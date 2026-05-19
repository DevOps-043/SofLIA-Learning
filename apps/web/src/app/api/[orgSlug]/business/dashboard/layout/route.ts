import { NextRequest, NextResponse } from 'next/server'
import { requireBusiness } from '@/lib/auth/requireBusiness'
import { apiError } from '@/lib/api/errors'
import { withZodBody } from '@/lib/api/with-validation'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'
import { requireFeature } from '@/lib/subscription/subscriptionHelper'
import {
  dashboardLayoutSaveSchema,
  type DashboardLayoutSaveBody,
} from '../../_schemas'

type RouteContext = {
  params: Promise<{ orgSlug: string }>
}

/**
 * GET /api/[orgSlug]/business/dashboard/layout
 * Obtiene el layout personalizado del dashboard de la organizacion
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

    const { data: layout, error: layoutError } = await supabase
      .from('dashboard_layouts')
      .select(SELECT_COLUMNS.dashboard_layouts)
      .eq('organization_id', auth.organizationId)
      .eq('is_default', true)
      .maybeSingle()

    if (layoutError && layoutError.code !== 'PGRST116') {
      logger.error('Error fetching dashboard layout:', layoutError)
      return NextResponse.json({
        success: false,
        error: 'Error al obtener layout del dashboard',
      }, { status: 500 })
    }

    if (!layout) {
      return NextResponse.json({
        success: true,
        layout: {
          id: null,
          name: 'Dashboard por Defecto',
          layout_config: {
            widgets: [
              { id: 'stats-overview', type: 'stats', position: { x: 0, y: 0, w: 12, h: 2 } },
              { id: 'progress-chart', type: 'progress-chart', position: { x: 0, y: 2, w: 8, h: 4 } },
              { id: 'recent-activity', type: 'activity', position: { x: 8, y: 2, w: 4, h: 4 } },
              { id: 'users-chart', type: 'users-chart', position: { x: 0, y: 6, w: 6, h: 4 } },
              { id: 'courses-chart', type: 'courses-chart', position: { x: 6, y: 6, w: 6, h: 4 } },
            ],
          },
          is_default: true,
        },
      })
    }

    return NextResponse.json({
      success: true,
      layout,
    })
  } catch (error) {
    logger.error('Error in /api/[orgSlug]/business/dashboard/layout GET:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor',
    }, { status: 500 })
  }
}

/**
 * POST /api/[orgSlug]/business/dashboard/layout
 * Guarda o actualiza el layout personalizado del dashboard
 */
async function handlePost(
  _request: NextRequest,
  body: DashboardLayoutSaveBody,
  { params }: RouteContext,
) {
  try {
    const { orgSlug } = await params

    const auth = await requireBusiness({ organizationSlug: orgSlug })
    if (auth instanceof NextResponse) return auth

    if (!auth.organizationId) {
      return apiError('NO_ORGANIZATION', 'Usuario no pertenece a ninguna organizacion', 400)
    }

    const featureCheck = await requireFeature(auth.organizationId, 'custom_dashboard')
    if (featureCheck) {
      return featureCheck
    }

    const supabase = await createClient()
    const { name, layout_config, is_default } = body

    if (is_default) {
      await supabase
        .from('dashboard_layouts')
        .update({ is_default: false })
        .eq('organization_id', auth.organizationId)
        .eq('is_default', true)
    }

    const { data: existingLayout } = await supabase
      .from('dashboard_layouts')
      .select('id')
      .eq('organization_id', auth.organizationId)
      .eq('is_default', true)
      .maybeSingle()

    let layout

    if (existingLayout) {
      const { data: updatedLayout, error: updateError } = await supabase
        .from('dashboard_layouts')
        .update({
          name,
          layout_config,
          is_default: is_default !== undefined ? is_default : true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingLayout.id)
        .eq('organization_id', auth.organizationId)
        .select()
        .single()

      if (updateError) {
        logger.error('Error updating dashboard layout:', updateError)
        return apiError(
          'UPDATE_DASHBOARD_LAYOUT_FAILED',
          'Error al actualizar layout del dashboard',
          500,
        )
      }

      layout = updatedLayout
    } else {
      const { data: newLayout, error: createError } = await supabase
        .from('dashboard_layouts')
        .insert({
          organization_id: auth.organizationId,
          name,
          layout_config,
          is_default: is_default !== undefined ? is_default : true,
        })
        .select()
        .single()

      if (createError) {
        logger.error('Error creating dashboard layout:', createError)
        return apiError(
          'CREATE_DASHBOARD_LAYOUT_FAILED',
          'Error al crear layout del dashboard',
          500,
        )
      }

      layout = newLayout
    }

    return NextResponse.json({
      success: true,
      layout,
    })
  } catch (error) {
    logger.error('Error in /api/[orgSlug]/business/dashboard/layout POST:', error)
    return apiError('SAVE_DASHBOARD_LAYOUT_FAILED', 'Error interno del servidor', 500)
  }
}

export const POST = withZodBody(dashboardLayoutSaveSchema, handlePost)

/**
 * DELETE /api/[orgSlug]/business/dashboard/layout
 * Elimina el layout personalizado y restaura el por defecto
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

    const { error } = await supabase
      .from('dashboard_layouts')
      .delete()
      .eq('organization_id', auth.organizationId)

    if (error) {
      logger.error('Error deleting dashboard layout:', error)
      return NextResponse.json({
        success: false,
        error: 'Error al eliminar layout del dashboard',
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Layout personalizado eliminado exitosamente',
    })
  } catch (error) {
    logger.error('Error in /api/[orgSlug]/business/dashboard/layout DELETE:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor',
    }, { status: 500 })
  }
}
