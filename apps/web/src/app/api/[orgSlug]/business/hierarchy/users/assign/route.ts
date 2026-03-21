import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireBusiness } from '@/lib/auth/requireBusiness';
import { logger } from '@/lib/utils/logger';

interface RouteContext {
  params: Promise<{ orgSlug: string }>;
}

/**
 * POST /api/[orgSlug]/business/hierarchy/users/assign
 * Asigna un usuario a un equipo
 */
export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const { orgSlug } = await params;
    const auth = await requireBusiness({ organizationSlug: orgSlug });
    if (auth instanceof NextResponse) return auth;

    if (!auth.organizationId) {
      return NextResponse.json(
        { success: false, error: 'No tienes una organización asignada' },
        { status: 403 }
      );
    }

    // Verificar permisos (owner, admin pueden asignar)
    if (auth.organizationRole !== 'owner' && auth.organizationRole !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'No tienes permisos para asignar usuarios' },
        { status: 403 }
      );
    }

    const body = await request.json();

    if (!body.user_id) {
      return NextResponse.json(
        { success: false, error: 'El ID del usuario es requerido' },
        { status: 400 }
      );
    }

    if (!body.team_id) {
      return NextResponse.json(
        { success: false, error: 'El ID del equipo es requerido' },
        { status: 400 }
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
      return NextResponse.json(
        { success: false, error: 'Equipo no encontrado' },
        { status: 404 }
      );
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
      return NextResponse.json(
        { success: false, error: 'Usuario no encontrado en la organización' },
        { status: 404 }
      );
    }

    // No se puede asignar al owner a un equipo
    if (orgUser.role === 'owner') {
      return NextResponse.json(
        { success: false, error: 'El propietario no puede ser asignado a un equipo' },
        { status: 400 }
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
        return NextResponse.json(
          { success: false, error: `El equipo ha alcanzado su límite de ${team.max_members} miembros` },
          { status: 400 }
        );
      }
    }

    const zone = team.zone as any;
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
      return NextResponse.json(
        { success: false, error: 'Error al asignar usuario' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      user: updatedUser,
      message: `Usuario asignado al equipo "${team.name}"`
    });
  } catch (error) {
    logger.error('Error en POST /api/[orgSlug]/business/hierarchy/users/assign:', error);
    return NextResponse.json(
      { success: false, error: 'Error al asignar usuario' },
      { status: 500 }
    );
  }
}
