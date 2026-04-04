import { NextRequest, NextResponse } from 'next/server'
import { requireBusiness } from '@/lib/auth/requireBusiness'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'

interface HierarchyEntityInfo {
  id: string
  name: string
  code: string | null
  description: string | null
}

interface HierarchyAssignmentUpdateData {
  due_date?: string | null
  start_date?: string | null
  approach?: string | null
  message?: string | null
  status?: string
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Error interno del servidor'
}

/**
 * GET /api/business/hierarchy/courses/assignments/[id]
 * Obtiene el detalle de una asignación jerárquica
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Obtener asignación base
    const { data: assignment, error: assignmentError } = await supabase
      .from('hierarchy_course_assignments')
      .select(`
        id,
        organization_id,
        course_id,
        assigned_by,
        assigned_at,
        due_date,
        start_date,
        approach,
        message,
        status,
        total_users,
        assigned_users_count,
        completed_users_count,
        created_at,
        updated_at,
        courses:course_id (
          id,
          title,
          description,
          slug,
          thumbnail_url,
          duration_total_minutes
        ),
        assigner:assigned_by (
          id,
          display_name,
          first_name,
          last_name,
          email,
          profile_picture_url
        )
      `)
      .eq('id', params.id)
      .eq('organization_id', auth.organizationId)
      .single()

    if (assignmentError || !assignment) {
      return NextResponse.json({
        success: false,
        error: 'Asignación no encontrada'
      }, { status: 404 })
    }

    // Determinar tipo de entidad y obtener información
    let entity_type: string | null = null
    let entity_id: string | null = null
    let entity: HierarchyEntityInfo | null = null

    const { data: regionData } = await supabase
      .from('region_course_assignments')
      .select(`
        region_id,
        organization_regions:region_id (
          id,
          name,
          code,
          description
        )
      `)
      .eq('hierarchy_assignment_id', params.id)
      .single()

    if (regionData) {
      entity_type = 'region'
      entity_id = regionData.region_id
      entity = regionData.organization_regions
    } else {
      const { data: zoneData } = await supabase
        .from('zone_course_assignments')
        .select(`
          zone_id,
          organization_zones:zone_id (
            id,
            name,
            code,
            description
          )
        `)
        .eq('hierarchy_assignment_id', params.id)
        .single()

      if (zoneData) {
        entity_type = 'zone'
        entity_id = zoneData.zone_id
        entity = zoneData.organization_zones
      } else {
        const { data: teamData } = await supabase
          .from('team_course_assignments')
          .select(`
            team_id,
            organization_teams:team_id (
              id,
              name,
              code,
              description
            )
          `)
          .eq('hierarchy_assignment_id', params.id)
          .single()

        if (teamData) {
          entity_type = 'team'
          entity_id = teamData.team_id
          entity = teamData.organization_teams
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        ...assignment,
        entity_type,
        entity_id,
        entity
      }
    })
  } catch (error: unknown) {
    logger.error('Error inesperado en GET /api/business/hierarchy/courses/assignments/[id]:', error)
    return NextResponse.json({
      success: false,
      error: getErrorMessage(error)
    }, { status: 500 })
  }
}

/**
 * PUT /api/business/hierarchy/courses/assignments/[id]
 * Actualiza una asignación jerárquica (solo campos editables, no cambia la entidad)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireBusiness()
    if (auth instanceof NextResponse) return auth

    if (!auth.organizationId) {
      return NextResponse.json({
        success: false,
        error: 'No tienes una organización asignada'
      }, { status: 403 })
    }

    const body = await request.json()
    const { due_date, start_date, approach, message, status } = body

    const supabase = await createClient()

    // Verificar que la asignación existe y pertenece a la organización
    const { data: existingAssignment, error: checkError } = await supabase
      .from('hierarchy_course_assignments')
      .select('id, status')
      .eq('id', params.id)
      .eq('organization_id', auth.organizationId)
      .single()

    if (checkError || !existingAssignment) {
      return NextResponse.json({
        success: false,
        error: 'Asignación no encontrada'
      }, { status: 404 })
    }

    // Preparar datos de actualización
    const updateData: HierarchyAssignmentUpdateData = {}

    if (due_date !== undefined) updateData.due_date = due_date || null
    if (start_date !== undefined) updateData.start_date = start_date || null
    if (approach !== undefined) {
      if (approach && !['fast', 'balanced', 'long', 'custom'].includes(approach)) {
        return NextResponse.json({
          success: false,
          error: 'Enfoque inválido. Debe ser: fast, balanced, long o custom'
        }, { status: 400 })
      }
      updateData.approach = approach || null
    }
    if (message !== undefined) updateData.message = message && message.trim() ? message.trim() : null
    if (status !== undefined) {
      if (!['active', 'completed', 'cancelled'].includes(status)) {
        return NextResponse.json({
          success: false,
          error: 'Estado inválido. Debe ser: active, completed o cancelled'
        }, { status: 400 })
      }
      updateData.status = status
    }

    // Actualizar asignación
    const { data: updatedAssignment, error: updateError } = await supabase
      .from('hierarchy_course_assignments')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single()

    if (updateError) {
      logger.error('Error actualizando asignación:', updateError)
      return NextResponse.json({
        success: false,
        error: 'Error al actualizar la asignación'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: updatedAssignment
    })
  } catch (error: unknown) {
    logger.error('Error inesperado en PUT /api/business/hierarchy/courses/assignments/[id]:', error)
    return NextResponse.json({
      success: false,
      error: getErrorMessage(error)
    }, { status: 500 })
  }
}

/**
 * DELETE /api/business/hierarchy/courses/assignments/[id]
 * Cancela una asignación jerárquica (actualiza status, no elimina)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Verificar que la asignación existe y pertenece a la organización
    const { data: existingAssignment, error: checkError } = await supabase
      .from('hierarchy_course_assignments')
      .select('id, status')
      .eq('id', params.id)
      .eq('organization_id', auth.organizationId)
      .single()

    if (checkError || !existingAssignment) {
      return NextResponse.json({
        success: false,
        error: 'Asignación no encontrada'
      }, { status: 404 })
    }

    // Si ya está cancelada, retornar éxito
    if (existingAssignment.status === 'cancelled') {
      return NextResponse.json({
        success: true,
        message: 'La asignación ya estaba cancelada'
      })
    }

    // Actualizar status a cancelled
    const { error: updateError } = await supabase
      .from('hierarchy_course_assignments')
      .update({ status: 'cancelled' })
      .eq('id', params.id)

    if (updateError) {
      logger.error('Error cancelando asignación:', updateError)
      return NextResponse.json({
        success: false,
        error: 'Error al cancelar la asignación'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Asignación cancelada exitosamente'
    })
  } catch (error: unknown) {
    logger.error('Error inesperado en DELETE /api/business/hierarchy/courses/assignments/[id]:', error)
    return NextResponse.json({
      success: false,
      error: getErrorMessage(error)
    }, { status: 500 })
  }
}
