import { NextRequest, NextResponse } from 'next/server'
import { requireBusiness } from '@/lib/auth/requireBusiness'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'
import { apiError } from '@/lib/api/errors'
import { withZodBody } from '@/lib/api/with-validation'
import {
  updateCourseAssignmentSchema,
  type UpdateCourseAssignmentBody,
} from '@/app/api/business/hierarchy/_schemas'

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
  return error instanceof Error ? error.message : 'Error interno'
}

/**
 * GET /api/[orgSlug]/business/hierarchy/courses/assignments/[id]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orgSlug: string; id: string }> }
) {
  try {
    const { orgSlug, id } = await params
    const auth = await requireBusiness({ organizationSlug: orgSlug })
    if (auth instanceof NextResponse) return auth

    if (!auth.organizationId) {
      return NextResponse.json({
        success: false,
        error: 'No tienes una organización asignada'
      }, { status: 403 })
    }

    const supabase = await createClient()

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
      .eq('id', id)
      .eq('organization_id', auth.organizationId)
      .single()

    if (assignmentError || !assignment) {
      return NextResponse.json({ success: false, error: 'Asignación no encontrada' }, { status: 404 })
    }

    let entity_type: string | null = null
    let entity_id: string | null = null
    let entity: HierarchyEntityInfo | null = null

    const { data: regionData } = await supabase
      .from('region_course_assignments')
      .select('region_id, organization_regions:region_id (id, name, code, description)')
      .eq('hierarchy_assignment_id', id)
      .maybeSingle()

    if (regionData) {
      entity_type = 'region'
      entity_id = regionData.region_id
      entity = regionData.organization_regions
    } else {
      const { data: zoneData } = await supabase
        .from('zone_course_assignments')
        .select('zone_id, organization_zones:zone_id (id, name, code, description)')
        .eq('hierarchy_assignment_id', id)
        .maybeSingle()

      if (zoneData) {
        entity_type = 'zone'
        entity_id = zoneData.zone_id
        entity = zoneData.organization_zones
      } else {
        const { data: teamData } = await supabase
          .from('team_course_assignments')
          .select('team_id, organization_teams:team_id (id, name, code, description)')
          .eq('hierarchy_assignment_id', id)
          .maybeSingle()

        if (teamData) {
          entity_type = 'team'
          entity_id = teamData.team_id
          entity = teamData.organization_teams
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: { ...assignment, entity_type, entity_id, entity }
    }, {
      headers: { 'Cache-Control': 'private, max-age=30, stale-while-revalidate=30' }
    })
  } catch (error: unknown) {
    logger.error('Error inesperado en GET [orgSlug]/hierarchy/courses/assignments/[id]:', error)
    return NextResponse.json({ success: false, error: getErrorMessage(error) }, { status: 500 })
  }
}

/**
 * PUT /api/[orgSlug]/business/hierarchy/courses/assignments/[id]
 */
async function handlePut(
  _request: NextRequest,
  body: UpdateCourseAssignmentBody,
  { params }: { params: Promise<{ orgSlug: string; id: string }> }
) {
  try {
    const { orgSlug, id } = await params
    const auth = await requireBusiness({ organizationSlug: orgSlug })
    if (auth instanceof NextResponse) return auth

    if (!auth.organizationId) {
      return apiError('NO_ORGANIZATION', 'No tienes una organización asignada', 403)
    }

    const { due_date, start_date, approach, message, status } = body

    const supabase = await createClient()

    const { data: existingAssignment, error: checkError } = await supabase
      .from('hierarchy_course_assignments')
      .select('id, status')
      .eq('id', id)
      .eq('organization_id', auth.organizationId)
      .single()

    if (checkError || !existingAssignment) {
      return apiError('ASSIGNMENT_NOT_FOUND', 'Asignación no encontrada', 404)
    }

    const updateData: HierarchyAssignmentUpdateData = {}
    if (due_date !== undefined) updateData.due_date = due_date || null
    if (start_date !== undefined) updateData.start_date = start_date || null
    if (approach !== undefined) updateData.approach = approach || null
    if (message !== undefined) updateData.message = message?.trim() || null
    if (status !== undefined) updateData.status = status

    const { data: updatedAssignment, error: updateError } = await supabase
      .from('hierarchy_course_assignments')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      logger.error('Error actualizando asignación:', updateError)
      return apiError('UPDATE_ASSIGNMENT_FAILED', 'Error al actualizar', 500)
    }

    return NextResponse.json({ success: true, data: updatedAssignment })
  } catch (error: unknown) {
    logger.error('Error inesperado en PUT [orgSlug]/hierarchy/courses/assignments/[id]:', error)
    return apiError('UPDATE_ASSIGNMENT_FAILED', getErrorMessage(error), 500)
  }
}

export const PUT = withZodBody(updateCourseAssignmentSchema, handlePut)

/**
 * DELETE /api/[orgSlug]/business/hierarchy/courses/assignments/[id]
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ orgSlug: string; id: string }> }
) {
  try {
    const { orgSlug, id } = await params
    const auth = await requireBusiness({ organizationSlug: orgSlug })
    if (auth instanceof NextResponse) return auth

    const supabase = await createClient()

    const { data: existingAssignment, error: checkError } = await supabase
      .from('hierarchy_course_assignments')
      .select('id, status')
      .eq('id', id)
      .eq('organization_id', auth.organizationId)
      .single()

    if (checkError || !existingAssignment) {
      return NextResponse.json({ success: false, error: 'Asignación no encontrada' }, { status: 404 })
    }

    const { error: updateError } = await supabase
      .from('hierarchy_course_assignments')
      .update({ status: 'cancelled' })
      .eq('id', id)

    if (updateError) {
      logger.error('Error cancelando asignación:', updateError)
      return NextResponse.json({ success: false, error: 'Error al cancelar' }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Asignación cancelada exitosamente' })
  } catch (error: unknown) {
    logger.error('Error inesperado en DELETE [orgSlug]/hierarchy/courses/assignments/[id]:', error)
    return NextResponse.json({ success: false, error: getErrorMessage(error) }, { status: 500 })
  }
}
