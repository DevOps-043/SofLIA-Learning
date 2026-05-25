import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireBusiness } from '@/lib/auth/requireBusiness';
import { logger } from '@/lib/utils/logger';
import { apiError } from '@/lib/api/errors';
import { withZodBody } from '@/lib/api/with-validation';
import {
  createTeamSchema,
  type CreateTeamBody,
} from '@/app/api/business/hierarchy/_schemas';

interface RouteContext {
  params: Promise<{ orgSlug: string }>;
}

interface OrganizationRegionRef {
  id: string;
  name: string;
  code: string | null;
}

interface OrganizationZoneRef {
  id: string;
  name: string;
  code: string | null;
  region?: OrganizationRegionRef | null;
}

interface OrganizationTeamRow {
  id: string;
  zone?: OrganizationZoneRef | null;
  [key: string]: unknown;
}

interface OrganizationUserTeamRow {
  team_id: string | null;
}

const parseLatLng = (value: number | string | null | undefined) => {
  if (value === null || value === undefined || value === '') return null;
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return Number.isNaN(num) ? null : num;
};

/**
 * GET /api/[orgSlug]/business/hierarchy/teams
 * Lista todos los equipos de la organización
 */
export async function GET(request: NextRequest, { params }: RouteContext) {
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

    let filteredTeams = (teams || []) as OrganizationTeamRow[];

    // Filtrar por región si se especifica
    if (regionId && filteredTeams.length > 0) {
      filteredTeams = filteredTeams.filter((team) =>
        team.zone?.region?.id === regionId
      );
    }

    let teamsWithCounts = filteredTeams;

    if (withCounts && filteredTeams.length > 0) {
      const teamIds = filteredTeams.map((team) => team.id);

      // Contar miembros por equipo
      const { data: memberCounts } = await supabase
        .from('organization_users')
        .select('team_id')
        .in('team_id', teamIds)
        .eq('status', 'active')
        .returns<OrganizationUserTeamRow[]>();

      teamsWithCounts = filteredTeams.map((team) => ({
        ...team,
        members_count: memberCounts?.filter((member) => member.team_id === team.id).length || 0
      }));
    }

    return NextResponse.json({
      success: true,
      teams: teamsWithCounts
    });
  } catch (error) {
    logger.error('Error en GET /api/[orgSlug]/business/hierarchy/teams:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener equipos' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/[orgSlug]/business/hierarchy/teams
 * Crea un nuevo equipo
 */
async function handlePost(
  _request: NextRequest,
  body: CreateTeamBody,
  { params }: RouteContext,
) {
  try {
    const { orgSlug } = await params;
    const auth = await requireBusiness({ organizationSlug: orgSlug });
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

    // Verificar que la zona existe y pertenece a la organización
    const { data: zone, error: zoneError } = await supabase
      .from('organization_zones')
      .select('id')
      .eq('id', body.zone_id)
      .eq('organization_id', auth.organizationId)
      .single();

    if (zoneError || !zone) {
      return apiError('ZONE_NOT_FOUND', 'Zona no encontrada', 404);
    }

    // Verificar nombre único dentro de la zona
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

    return NextResponse.json({
      success: true,
      team
    });
  } catch (error) {
    logger.error('Error en POST /api/[orgSlug]/business/hierarchy/teams:', error);
    return apiError('CREATE_TEAM_FAILED', 'Error al crear el equipo', 500);
  }
}

export const POST = withZodBody(createTeamSchema, handlePost);
