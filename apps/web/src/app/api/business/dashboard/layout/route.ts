import { NextRequest, NextResponse } from 'next/server'
import { requireBusiness } from '@/lib/auth/requireBusiness'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'
import { requireFeature } from '@/lib/subscription/subscriptionHelper'
import { apiError } from '@/lib/api/errors'
import { withZodBody } from '@/lib/api/with-validation'
import { dashboardLayoutSchema, type DashboardLayoutBody } from './schema'
import { SELECT_COLUMNS } from '@/lib/supabase/select-types';

/**
 * GET /api/business/dashboard/layout
 * Obtiene el layout personalizado del dashboard de la organización
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireBusiness()
    if (auth instanceof NextResponse) return auth

    if (!auth.organizationId) {
      return apiError('NO_ORGANIZATION', 'Usuario no pertenece a ninguna organización', 400)
    }

    const supabase = await createClient()

    // Obtener layout por defecto de la organización
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
        error: 'Error al obtener layout del dashboard'
      }, { status: 500 })
    }

    // Si no hay layout personalizado, retornar layout por defecto
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
              { id: 'courses-chart', type: 'courses-chart', position: { x: 6, y: 6, w: 6, h: 4 } }
            ]
          },
          is_default: true
        }
      })
    }

    return NextResponse.json({
      success: true,
      layout: layout
    })
  } catch (error) {
    logger.error('💥 Error in /api/business/dashboard/layout GET:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 })
  }
}

/**
 * POST /api/business/dashboard/layout
 * Guarda o actualiza el layout personalizado del dashboard
 */
async function handlePost(
  _request: NextRequest,
  body: DashboardLayoutBody,
  _context: unknown,
) {
  try {
    const auth = await requireBusiness()
    if (auth instanceof NextResponse) return auth

    if (!auth.organizationId) {
      return NextResponse.json({
        success: false,
        error: 'Usuario no pertenece a ninguna organización'
      }, { status: 400 })
    }

    // Verificar que el plan permite dashboards personalizables (solo Enterprise según tablas)
    const featureCheck = await requireFeature(auth.organizationId, 'custom_dashboard')
    if (featureCheck) {
      return featureCheck
    }

    const supabase = await createClient()

    const { name, layout_config, is_default } = body

    // Si es el layout por defecto, desmarcar otros layouts por defecto
    if (is_default) {
      await supabase
        .from('dashboard_layouts')
        .update({ is_default: false })
        .eq('organization_id', auth.organizationId)
        .eq('is_default', true)
    }

    // Verificar si ya existe un layout por defecto
    const { data: existingLayout } = await supabase
      .from('dashboard_layouts')
      .select('id')
      .eq('organization_id', auth.organizationId)
      .eq('is_default', true)
      .maybeSingle()

    let layout

    if (existingLayout) {
      // Actualizar layout existente
      const { data: updatedLayout, error: updateError } = await supabase
        .from('dashboard_layouts')
        .update({
          name,
          layout_config,
          is_default: is_default !== undefined ? is_default : true,
          updated_at: new Date().toISOString()
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
      // Crear nuevo layout
      const { data: newLayout, error: createError } = await supabase
        .from('dashboard_layouts')
        .insert({
          organization_id: auth.organizationId,
          name,
          layout_config,
          is_default: is_default !== undefined ? is_default : true
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
      layout: layout
    })
  } catch (error) {
    logger.error('💥 Error in /api/business/dashboard/layout POST:', error)
    return apiError('SAVE_DASHBOARD_LAYOUT_FAILED', 'Error interno del servidor', 500)
  }
}

export const POST = withZodBody(dashboardLayoutSchema, handlePost)

/**
 * DELETE /api/business/dashboard/layout
 * Elimina el layout personalizado y restaura el por defecto
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

    const { error } = await supabase
      .from('dashboard_layouts')
      .delete()
      .eq('organization_id', auth.organizationId)

    if (error) {
      logger.error('Error deleting dashboard layout:', error)
      return NextResponse.json({
        success: false,
        error: 'Error al eliminar layout del dashboard'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Layout personalizado eliminado exitosamente'
    })
  } catch (error) {
    logger.error('💥 Error in /api/business/dashboard/layout DELETE:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 })
  }
}
