import { NextRequest, NextResponse } from 'next/server';

import { apiError } from '@/lib/api/errors';
import { withZodBody } from '@/lib/api/with-validation';
import { requireBusiness } from '@/lib/auth/requireBusiness';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

import {
  assignUsersSchema,
  type AssignUsersBody,
} from '../../_schemas';

async function handlePost(_request: NextRequest, body: AssignUsersBody) {
  try {
    const auth = await requireBusiness();
    if (auth instanceof NextResponse) return auth;

    if (!auth.organizationId) {
      return apiError(
        'NO_ORGANIZATION',
        'No tienes una organización asignada',
        403,
      );
    }

    if (auth.organizationRole !== 'owner' && auth.organizationRole !== 'admin') {
      return apiError(
        'FORBIDDEN',
        'No tienes permisos para asignar usuarios',
        403,
      );
    }

    const supabase = await createClient();

    const { data: team, error: teamError } = await supabase
      .from('organization_teams')
      .select(
        `id, name, max_members, zone_id,
         zone:organization_zones!zone_id (id, region_id)`,
      )
      .eq('id', body.team_id)
      .eq('organization_id', auth.organizationId)
      .eq('is_active', true)
      .single();

    if (teamError || !team) {
      return apiError('TEAM_NOT_FOUND', 'Equipo no encontrado', 404);
    }

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

    if (orgUser.role === 'owner') {
      return apiError(
        'CANNOT_ASSIGN_OWNER',
        'El propietario no puede ser asignado a un equipo',
        400,
      );
    }

    if (team.max_members) {
      const { count: currentMembers } = await supabase
        .from('organization_users')
        .select('id', { count: 'exact', head: true })
        .eq('team_id', body.team_id)
        .eq('status', 'active');

      const isAlreadyInTeam = orgUser.team_id === body.team_id;
      if (
        !isAlreadyInTeam &&
        currentMembers &&
        currentMembers >= team.max_members
      ) {
        return apiError(
          'TEAM_FULL',
          `El equipo ha alcanzado su límite de ${team.max_members} miembros`,
          400,
        );
      }
    }

    const zone = team.zone as { id: string; region_id: string } | null;
    const zoneId = team.zone_id;
    const regionId = zone?.region_id;

    const updateData: Record<string, unknown> = {
      team_id: body.team_id,
      zone_id: zoneId,
      region_id: regionId,
      hierarchy_scope: 'team',
    };

    if (body.role) {
      updateData.role = body.role;
    }

    const { data: updatedUser, error: updateError } = await supabase
      .from('organization_users')
      .update(updateData)
      .eq('id', orgUser.id)
      .select(
        `id, user_id, role, status, team_id, zone_id, region_id, hierarchy_scope, job_title,
         users!inner (id, username, email, display_name, first_name, last_name, profile_picture_url)`,
      )
      .single();

    if (updateError) {
      logger.error('Error asignando usuario a equipo:', updateError);
      return apiError(
        'ASSIGN_USER_FAILED',
        'Error al asignar usuario',
        500,
      );
    }

    logger.info('Usuario asignado a equipo:', {
      userId: body.user_id,
      teamId: body.team_id,
      teamName: team.name,
    });

    return NextResponse.json({
      success: true,
      user: updatedUser,
      message: `Usuario asignado al equipo "${team.name}"`,
    });
  } catch (error) {
    logger.error('Error en POST /api/business/hierarchy/users/assign:', error);
    return apiError('ASSIGN_USER_FAILED', 'Error al asignar usuario', 500);
  }
}

export const POST = withZodBody(assignUsersSchema, handlePost);
