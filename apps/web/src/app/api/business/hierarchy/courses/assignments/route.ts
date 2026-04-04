import { NextRequest, NextResponse } from 'next/server'
import { requireBusiness } from '@/lib/auth/requireBusiness'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback
}

/**
 * GET /api/business/hierarchy/courses/assignments
 * Lista asignaciones jerárquicas de cursos
 * Query params:
 *   - entity_type: 'region' | 'zone' | 'team' (opcional)
 *   - entity_id: UUID de la entidad (opcional)
 *   - course_id: UUID del curso (opcional)
 *   - status: 'active' | 'completed' | 'cancelled' (opcional)
 *   - limit: número de resultados (default: 50)
 *   - offset: offset para paginación (default: 0)
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireBusiness()
    if (auth instanceof NextResponse) return auth

    if (!auth.organizationId) {
      return NextResponse.json({
        success: false,
        error: 'No tienes una organización asignada'
      }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const entity_type = searchParams.get('entity_type')
    const entity_id = searchParams.get('entity_id')
    const course_id = searchParams.get('course_id')
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const supabase = await createClient()

    // Construir query base
    let query = supabase
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
          thumbnail_url
        ),
        assigner:assigned_by (
          id,
          display_name,
          first_name,
          last_name,
          email
        )
      `)
      .eq('organization_id', auth.organizationId)

    // Aplicar filtros
    if (status) {
      query = query.eq('status', status)
    }

    if (course_id) {
      query = query.eq('course_id', course_id)
    }

    // Filtrar por entidad si se especifica
    let entityFilterIds: string[] = []
    if (entity_type && entity_id) {
      if (entity_type === 'region') {
        const { data: regionAssignments } = await supabase
          .from('region_course_assignments')
          .select('hierarchy_assignment_id')
          .eq('region_id', entity_id)
        entityFilterIds = regionAssignments?.map(a => a.hierarchy_assignment_id) || []
      } else if (entity_type === 'zone') {
        const { data: zoneAssignments } = await supabase
          .from('zone_course_assignments')
          .select('hierarchy_assignment_id')
          .eq('zone_id', entity_id)
        entityFilterIds = zoneAssignments?.map(a => a.hierarchy_assignment_id) || []
      } else if (entity_type === 'team') {
        const { data: teamAssignments } = await supabase
          .from('team_course_assignments')
          .select('hierarchy_assignment_id')
          .eq('team_id', entity_id)
        entityFilterIds = teamAssignments?.map(a => a.hierarchy_assignment_id) || []
      }
      
      if (entityFilterIds.length > 0) {
        query = query.in('id', entityFilterIds)
      } else {
        // Si no hay asignaciones para esta entidad, retornar vacío
        return NextResponse.json({
          success: true,
          data: [],
          pagination: {
            limit,
            offset,
            total: 0
          }
        })
      }
    }

    // Aplicar paginación
    query = query.order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    const { data: assignments, error } = await query

    if (error) {
      logger.error('Error obteniendo asignaciones:', error)
      return NextResponse.json({
        success: false,
        error: 'Error al obtener asignaciones'
      }, { status: 500 })
    }

    // Obtener información de entidades para cada asignación
    const assignmentsWithEntities = await Promise.all(
      (assignments || []).map(async (assignment) => {
        // Determinar tipo de entidad y obtener información
        const { data: regionData } = await supabase
          .from('region_course_assignments')
          .select(`
            region_id,
            organization_regions:region_id (
              id,
              name,
              code
            )
          `)
          .eq('hierarchy_assignment_id', assignment.id)
          .single()

        if (regionData) {
          return {
            ...assignment,
            entity_type: 'region',
            entity_id: regionData.region_id,
            entity: regionData.organization_regions
          }
        }

        const { data: zoneData } = await supabase
          .from('zone_course_assignments')
          .select(`
            zone_id,
            organization_zones:zone_id (
              id,
              name,
              code
            )
          `)
          .eq('hierarchy_assignment_id', assignment.id)
          .single()

        if (zoneData) {
          return {
            ...assignment,
            entity_type: 'zone',
            entity_id: zoneData.zone_id,
            entity: zoneData.organization_zones
          }
        }

        const { data: teamData } = await supabase
          .from('team_course_assignments')
          .select(`
            team_id,
            organization_teams:team_id (
              id,
              name,
              code
            )
          `)
          .eq('hierarchy_assignment_id', assignment.id)
          .single()

        if (teamData) {
          return {
            ...assignment,
            entity_type: 'team',
            entity_id: teamData.team_id,
            entity: teamData.organization_teams
          }
        }

        return {
          ...assignment,
          entity_type: null,
          entity_id: null,
          entity: null
        }
      })
    )

    return NextResponse.json({
      success: true,
      data: assignmentsWithEntities,
      pagination: {
        limit,
        offset,
        total: assignmentsWithEntities.length
      }
    })
  } catch (error: unknown) {
    logger.error('Error inesperado en GET /api/business/hierarchy/courses/assignments:', error)
    return NextResponse.json({
      success: false,
      error: getErrorMessage(error, 'Error interno del servidor')
    }, { status: 500 })
  }
}
