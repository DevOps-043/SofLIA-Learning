import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireBusiness } from '@/lib/auth/requireBusiness';
import { logger } from '@/lib/utils/logger';
import { apiError } from '@/lib/api/errors';
import { withZodBody } from '@/lib/api/with-validation';
import {
  assignUsersSchema,
  type AssignUsersBody,
} from '@/app/api/business/hierarchy/_schemas';

interface RouteContext {
  params: Promise<{ orgSlug: string }>;
}

/**
 * POST /api/[orgSlug]/business/hierarchy/users/assign
 * Asigna un usuario a un equipo
 */
async function handlePost(
  _request: NextRequest,
  body: AssignUsersBody,
  { params }: RouteContext,
) {
  try {
    const { orgSlug } = await params;
    const auth = await requireBusiness({ organizationSlug: orgSlug });
    if (auth instanceof NextResponse) return auth;

    if (!auth.organizationId) {
      return apiError('NO_ORGANIZATION', 'No tienes una organización asignada', 403);
    }

    // Verificar permisos (owner, admin pueden asignar)
    if (auth.organizationRole !== 'owner' && auth.organizationRole !== 'admin') {
      return apiError(
        'FORBIDDEN',
        'No tienes permisos para asignar usuarios',
        403,
      );
    }

    const supabase = await createClient();

    // Verificar que el equipo existe y pertenece a la organización
    const { data: team, error: teamError } = await supabase
      .from('organization_teams')
      .select(`
        id,
        name,
        max_members,
        zone_id,
        zone:organization_zones!zone_id (
          id,
          region_id
        )
      `)
      .eq('id', body.team_id)
      .eq('organization_id', auth.organizationId)
      .eq('is_active', true)
      .single();

    if (teamError || !team) {
      return apiError('TEAM_NOT_FOUND', 'Equipo no encontrado', 404);
    }

    // Verificar que el usuario pertenece a la organización
    const { data: orgUser, error: userError } = await supabase
      .from('organization_users')
      .select('id, user_id, role, team_id')
      .eq('user_id', body.user_id)
      .eq('organization_id', auth.organizationId)
      .eq('status', 'active')
      .single();

    if (userError || !orgUser) {
      return apiError(
        'USER_NOT_IN_ORG',
        'Usuario no encontrado en la organización',
        404,
      );
    }

    // No se puede asignar al owner a un equipo
    if (orgUser.role === 'owner') {
      return apiError(
        'CANNOT_ASSIGN_OWNER',
        'El propietario no puede ser asignado a un equipo',
        400,
      );
    }

    // Verificar límite de miembros del equipo
    if (team.max_members) {
      const { count: currentMembers } = await supabase
        .from('organization_users')
        .select('id', { count: 'exact', head: true })
        .eq('team_id', body.team_id)
        .eq('status', 'active');

      const isAlreadyInTeam = orgUser.team_id === body.team_id;

      if (!isAlreadyInTeam && currentMembers && currentMembers >= team.max_members) {
        return apiError(
          'TEAM_FULL',
          `El equipo ha alcanzado su límite de ${team.max_members} miembros`,
          400,
        );
      }
    }

    const zone = team.zone as { region_id?: string } | null;
    const zoneId = team.zone_id;
    const regionId = zone?.region_id;

    // Preparar actualización
    const updateData: Record<string, unknown> = {
      team_id: body.team_id,
      zone_id: zoneId,
      region_id: regionId,
      hierarchy_scope: 'team'
    };

    if (body.role && ['team_leader', 'member'].includes(body.role)) {
      updateData.role = body.role;
    }

    // Actualizar el usuario
    const { data: updatedUser, error: updateError } = await supabase
      .from('organization_users')
      .update(updateData)
      .eq('id', orgUser.id)
      .select(`
        id,
        user_id,
        role,
        status,
        team_id,
        zone_id,
        region_id,
        hierarchy_scope,
        job_title,
        users!inner (
          id,
          username,
          email,
          display_name,
          first_name,
          last_name,
          profile_picture_url
        )
      `)
      .single();

    if (updateError) {
      logger.error('Error asignando usuario a equipo:', updateError);
      return apiError('ASSIGN_USER_FAILED', 'Error al asignar usuario', 500);
    }

    return NextResponse.json({
      success: true,
      user: updatedUser,
      message: `Usuario asignado al equipo "${team.name}"`
    });
  } catch (error) {
    logger.error('Error en POST /api/[orgSlug]/business/hierarchy/users/assign:', error);
    return apiError('ASSIGN_USER_FAILED', 'Error al asignar usuario', 500);
  }
}

export const POST = withZodBody(assignUsersSchema, handlePost);
