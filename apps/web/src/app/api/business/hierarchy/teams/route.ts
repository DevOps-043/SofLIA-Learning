import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireBusiness } from '@/lib/auth/requireBusiness';
import { logger } from '@/lib/utils/logger';
import { apiError } from '@/lib/api/errors';
import { withZodBody } from '@/lib/api/with-validation';
import { createTeamSchema, type CreateTeamBody } from '../_schemas';

interface TeamRegionRow {
  id: string
  name: string
  code: string | null
}

interface TeamZoneRow {
  id: string
  name: string
  code: string | null
  region: TeamRegionRow | null
}

interface TeamRow {
  id: string
  name: string
  zone_id: string
  organization_id: string
  zone: TeamZoneRow | null
  is_active?: boolean | null
}

interface TeamMemberRow {
  team_id: string | null
}

interface TeamWithCounts extends TeamRow {
  members_count: number
}

interface CreateTeamRequest {
  zone_id: string
  name: string
  description?: string
  code?: string
  max_members?: number | null
  metadata?: Record<string, unknown>
  address?: string
  city?: string
  state?: string
  country?: string
  postal_code?: string
  latitude?: string | number | null
  longitude?: string | number | null
  phone?: string
  email?: string
  leader_id?: string | null
  target_goal?: string
  monthly_target?: number | null
}

/**
 * GET /api/business/hierarchy/teams
 * Lista todos los equipos de la organización
 */
export async function GET(request: Request) {
  try {
    const auth = await requireBusiness();
    if (auth instanceof NextResponse) return auth;

    if (!auth.organizationId) {
      return NextResponse.json(
        { success: false, error: 'No tienes una organización asignada' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const zoneId = searchParams.get('zoneId');
    const regionId = searchParams.get('regionId');
    const includeInactive = searchParams.get('includeInactive') === 'true';
    const withCounts = searchParams.get('withCounts') === 'true';

    const supabase = await createClient();

    let query = supabase
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
      .eq('organization_id', auth.organizationId)
      .order('name', { ascending: true });

    if (zoneId) {
      query = query.eq('zone_id', zoneId);
    }

    if (!includeInactive) {
      query = query.eq('is_active', true);
    }

    const { data: teams, error } = await query;

    if (error) {
      logger.error('Error obteniendo equipos:', error);
      return NextResponse.json(
        { success: false, error: 'Error al obtener equipos' },
        { status: 500 }
      );
    }

    let filteredTeams: TeamRow[] = (teams || []) as TeamRow[];

    // Filtrar por región si se especifica
    if (regionId && filteredTeams.length > 0) {
      filteredTeams = filteredTeams.filter((team) =>
        team.zone?.region?.id === regionId
      );
    }

    let teamsWithCounts: Array<TeamRow | TeamWithCounts> = filteredTeams;

    if (withCounts && filteredTeams.length > 0) {
      const teamIds = filteredTeams.map((team) => team.id);

      // Contar miembros por equipo
      const { data: memberCounts } = await supabase
        .from('organization_users')
        .select('team_id')
        .in('team_id', teamIds)
        .eq('status', 'active');

      const members = (memberCounts || []) as TeamMemberRow[];
      teamsWithCounts = filteredTeams.map((team) => ({
        ...team,
        members_count: members.filter((member) => member.team_id === team.id).length
      }));
    }

    return NextResponse.json({
      success: true,
      teams: teamsWithCounts
    });
  } catch (error) {
    logger.error('Error en GET /api/business/hierarchy/teams:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener equipos' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/business/hierarchy/teams
 * Crea un nuevo equipo
 */
async function handlePost(_request: NextRequest, body: CreateTeamBody) {
  try {
    const auth = await requireBusiness();
    if (auth instanceof NextResponse) return auth;

    if (!auth.organizationId) {
      return apiError('NO_ORGANIZATION', 'No tienes una organización asignada', 403);
    }

    if (auth.organizationRole !== 'owner' && auth.organizationRole !== 'admin') {
      return apiError(
        'FORBIDDEN',
        'Solo el propietario o administrador puede crear equipos',
        403,
      );
    }

    const supabase = await createClient();

    const { data: zone, error: zoneError } = await supabase
      .from('organization_zones')
      .select('id')
      .eq('id', body.zone_id)
      .eq('organization_id', auth.organizationId)
      .single();

    if (zoneError || !zone) {
      return apiError('ZONE_NOT_FOUND', 'Zona no encontrada', 404);
    }

    const { count: existingCount } = await supabase
      .from('organization_teams')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', auth.organizationId)
      .eq('zone_id', body.zone_id)
      .ilike('name', body.name.trim());

    if (existingCount && existingCount > 0) {
      return apiError(
        'DUPLICATE_NAME',
        'Ya existe un equipo con ese nombre en esta zona',
        400,
      );
    }

    const parseLatLng = (value: number | string | null | undefined) => {
      if (value === null || value === undefined || value === '') return null;
      const num = typeof value === 'string' ? parseFloat(value) : value;
      return Number.isNaN(num) ? null : num;
    };

    const { data: team, error } = await supabase
      .from('organization_teams')
      .insert({
        organization_id: auth.organizationId,
        zone_id: body.zone_id,
        name: body.name.trim(),
        description: body.description?.trim() || null,
        code: body.code?.trim() || null,
        max_members: body.max_members || null,
        metadata: body.metadata || {},
        created_by: auth.userId,
        // Campos de ubicación
        address: body.address?.trim() || null,
        city: body.city?.trim() || null,
        state: body.state?.trim() || null,
        country: body.country?.trim() || null,
        postal_code: body.postal_code?.trim() || null,
        latitude: parseLatLng(body.latitude),
        longitude: parseLatLng(body.longitude),
        // Campos de contacto
        phone: body.phone?.trim() || null,
        email: body.email?.trim() || null,
        // Líder y objetivos
        leader_id: body.leader_id || null,
        target_goal: body.target_goal?.trim() || null,
        monthly_target: body.monthly_target || null
      })
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
      logger.error('Error creando equipo:', error);
      return apiError('CREATE_TEAM_FAILED', 'Error al crear el equipo', 500);
    }

    logger.info('Equipo creado:', { teamId: team.id, name: team.name });

    return NextResponse.json({ success: true, team });
  } catch (error) {
    logger.error('Error en POST /api/business/hierarchy/teams:', error);
    return apiError('CREATE_TEAM_FAILED', 'Error al crear el equipo', 500);
  }
}

export const POST = withZodBody(createTeamSchema, handlePost);
