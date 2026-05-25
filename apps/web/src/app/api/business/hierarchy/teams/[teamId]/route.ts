import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireBusiness } from '@/lib/auth/requireBusiness';
import { logger } from '@/lib/utils/logger';
import { apiError } from '@/lib/api/errors';
import { withZodBody } from '@/lib/api/with-validation';
import { updateTeamSchema, type UpdateTeamBody } from '../../_schemas';

interface RouteParams {
  params: Promise<{ teamId: string }>;
}

/**
 * GET /api/business/hierarchy/teams/[teamId]
 * Obtiene un equipo por ID
 */
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const auth = await requireBusiness();
    if (auth instanceof NextResponse) return auth;

    if (!auth.organizationId) {
      return NextResponse.json(
        { success: false, error: 'No tienes una organización asignada' },
        { status: 403 }
      );
    }

    const { teamId } = await params;
    const supabase = await createClient();

    const { data: team, error } = await supabase
      .from('organization_teams')
      .select(`
        *,
        zone:organization_zones!zone_id (
          id,
          name,
          code,
          region:organization_regions!region_id (
            id,
            name,
            code
          )
        )
      `)
      .eq('id', teamId)
      .eq('organization_id', auth.organizationId)
      .single();

    if (error || !team) {
      return NextResponse.json(
        { success: false, error: 'Equipo no encontrado' },
        { status: 404 }
      );
    }

    // Contar miembros
    const { count: membersCount } = await supabase
      .from('organization_users')
      .select('id', { count: 'exact', head: true })
      .eq('team_id', teamId)
      .eq('status', 'active');

    return NextResponse.json({
      success: true,
      team: {
        ...team,
        members_count: membersCount || 0
      }
    });
  } catch (error) {
    logger.error('Error en GET /api/business/hierarchy/teams/[teamId]:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener el equipo' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/business/hierarchy/teams/[teamId]
 * Actualiza un equipo
 */
async function handlePut(_request: NextRequest, body: UpdateTeamBody, { params }: RouteParams) {
  try {
    const auth = await requireBusiness();
    if (auth instanceof NextResponse) return auth;

    if (!auth.organizationId) {
      return apiError('NO_ORGANIZATION', 'No tienes una organización asignada', 403);
    }

    if (auth.organizationRole !== 'owner' && auth.organizationRole !== 'admin') {
      return apiError(
        'FORBIDDEN',
        'Solo el propietario o administrador puede modificar equipos',
        403,
      );
    }

    const { teamId } = await params;
    const supabase = await createClient();

    // Verificar que el equipo existe
    const { data: existingTeam, error: fetchError } = await supabase
      .from('organization_teams')
      .select('id, zone_id')
      .eq('id', teamId)
      .eq('organization_id', auth.organizationId)
      .single();

    if (fetchError || !existingTeam) {
      return apiError('TEAM_NOT_FOUND', 'Equipo no encontrado', 404);
    }

    if (body.name) {
      const { count: duplicateCount } = await supabase
        .from('organization_teams')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', auth.organizationId)
        .eq('zone_id', existingTeam.zone_id)
        .ilike('name', body.name.trim())
        .neq('id', teamId);

      if (duplicateCount && duplicateCount > 0) {
        return apiError(
          'DUPLICATE_NAME',
          'Ya existe un equipo con ese nombre en esta zona',
          400,
        );
      }
    }

    if (body.max_members !== undefined && body.max_members !== null) {
      const { count: currentMembers } = await supabase
        .from('organization_users')
        .select('id', { count: 'exact', head: true })
        .eq('team_id', teamId)
        .eq('status', 'active');

      if (currentMembers && body.max_members < currentMembers) {
        return apiError(
          'TEAM_MEMBERS_EXCEED_LIMIT',
          `El equipo tiene ${currentMembers} miembros. No puede establecer un límite menor.`,
          400,
        );
      }
    }

    const parseLatLng = (value: number | string | null | undefined) => {
      if (value === null || value === undefined || value === '') return null;
      const num = typeof value === 'string' ? parseFloat(value) : value;
      return Number.isNaN(num) ? null : num;
    };

    // Preparar datos de actualización
    const updateData: Record<string, unknown> = {};
    if (body.name !== undefined) updateData.name = body.name.trim();
    if (body.description !== undefined) updateData.description = body.description?.trim() || null;
    if (body.code !== undefined) updateData.code = body.code?.trim() || null;
    if (body.max_members !== undefined) updateData.max_members = body.max_members;
    if (typeof body.is_active === 'boolean') updateData.is_active = body.is_active;
    if (body.metadata !== undefined) updateData.metadata = body.metadata;
    
    // Campos de ubicación
    if (body.address !== undefined) updateData.address = body.address?.trim() || null;
    if (body.city !== undefined) updateData.city = body.city?.trim() || null;
    if (body.state !== undefined) updateData.state = body.state?.trim() || null;
    if (body.country !== undefined) updateData.country = body.country?.trim() || null;
    if (body.postal_code !== undefined) updateData.postal_code = body.postal_code?.trim() || null;
    if (body.latitude !== undefined) updateData.latitude = parseLatLng(body.latitude);
    if (body.longitude !== undefined) updateData.longitude = parseLatLng(body.longitude);
    
    // Campos de contacto
    if (body.phone !== undefined) updateData.phone = body.phone?.trim() || null;
    if (body.email !== undefined) updateData.email = body.email?.trim() || null;
    
    // Líder y objetivos
    if (body.leader_id !== undefined) updateData.leader_id = body.leader_id || null;
    if (body.target_goal !== undefined) updateData.target_goal = body.target_goal?.trim() || null;
    if (body.monthly_target !== undefined) updateData.monthly_target = body.monthly_target;

    if (Object.keys(updateData).length === 0) {
      return apiError('NO_CHANGES', 'No hay datos para actualizar', 400);
    }

    const { data: team, error } = await supabase
      .from('organization_teams')
      .update(updateData)
      .eq('id', teamId)
      .select(`
        *,
        zone:organization_zones!zone_id (
          id,
          name,
          code,
          region:organization_regions!region_id (
            id,
            name,
            code
          )
        )
      `)
      .single();

    if (error) {
      logger.error('Error actualizando equipo:', error);
      return apiError('UPDATE_TEAM_FAILED', 'Error al actualizar el equipo', 500);
    }

    logger.info('Equipo actualizado:', { teamId, changes: Object.keys(updateData) });

    return NextResponse.json({ success: true, team });
  } catch (error) {
    logger.error('Error en PUT /api/business/hierarchy/teams/[teamId]:', error);
    return apiError('UPDATE_TEAM_FAILED', 'Error al actualizar el equipo', 500);
  }
}

export const PUT = withZodBody(updateTeamSchema, handlePut);

/**
 * DELETE /api/business/hierarchy/teams/[teamId]
 * Elimina un equipo
 */
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const auth = await requireBusiness();
    if (auth instanceof NextResponse) return auth;

    if (!auth.organizationId) {
      return NextResponse.json(
        { success: false, error: 'No tienes una organización asignada' },
        { status: 403 }
      );
    }

    if (auth.organizationRole !== 'owner' && auth.organizationRole !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Solo el propietario o administrador puede eliminar equipos' },
        { status: 403 }
      );
    }

    const { teamId } = await params;
    const supabase = await createClient();

    // Verificar que el equipo existe
    const { data: existingTeam, error: fetchError } = await supabase
      .from('organization_teams')
      .select('id, name')
      .eq('id', teamId)
      .eq('organization_id', auth.organizationId)
      .single();

    if (fetchError || !existingTeam) {
      return NextResponse.json(
        { success: false, error: 'Equipo no encontrado' },
        { status: 404 }
      );
    }

    // Verificar si hay usuarios asignados a este equipo
    const { count: usersInTeam } = await supabase
      .from('organization_users')
      .select('id', { count: 'exact', head: true })
      .eq('team_id', teamId)
      .eq('status', 'active');

    if (usersInTeam && usersInTeam > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Hay ${usersInTeam} usuario(s) asignados a este equipo. Reasígnelos antes de eliminar.`
        },
        { status: 400 }
      );
    }

    // Eliminar el equipo
    const { error } = await supabase
      .from('organization_teams')
      .delete()
      .eq('id', teamId);

    if (error) {
      logger.error('Error eliminando equipo:', error);
      return NextResponse.json(
        { success: false, error: 'Error al eliminar el equipo' },
        { status: 500 }
      );
    }

    logger.info('Equipo eliminado:', { teamId, name: existingTeam.name });

    return NextResponse.json({
      success: true,
      message: 'Equipo eliminado correctamente'
    });
  } catch (error) {
    logger.error('Error en DELETE /api/business/hierarchy/teams/[teamId]:', error);
    return NextResponse.json(
      { success: false, error: 'Error al eliminar el equipo' },
      { status: 500 }
    );
  }
}
