import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireBusiness } from '@/lib/auth/requireBusiness';
import { logger } from '@/lib/utils/logger';

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

    if (auth.organizationRole !== 'owner' && auth.organizationRole !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Solo el propietario o administrador puede crear equipos' },
        { status: 403 }
      );
    }

    const body = await request.json();

    if (!body.zone_id) {
      return NextResponse.json(
        { success: false, error: 'La zona es requerida' },
        { status: 400 }
      );
    }

    if (!body.name || typeof body.name !== 'string' || body.name.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'El nombre del equipo es requerido' },
        { status: 400 }
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
      return NextResponse.json(
        { success: false, error: 'Zona no encontrada' },
        { status: 404 }
      );
    }

    // Verificar nombre único dentro de la zona
    const { count: existingCount } = await supabase
      .from('organization_teams')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', auth.organizationId)
      .eq('zone_id', body.zone_id)
      .ilike('name', body.name.trim());

    if (existingCount && existingCount > 0) {
      return NextResponse.json(
        { success: false, error: 'Ya existe un equipo con ese nombre en esta zona' },
        { status: 400 }
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
        latitude: body.latitude !== null && body.latitude !== undefined && body.latitude !== '' ? parseFloat(body.latitude) : null,
        longitude: body.longitude !== null && body.longitude !== undefined && body.longitude !== '' ? parseFloat(body.longitude) : null,
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
      return NextResponse.json(
        { success: false, error: 'Error al crear el equipo' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      team
    });
  } catch (error) {
    logger.error('Error en POST /api/[orgSlug]/business/hierarchy/teams:', error);
    return NextResponse.json(
      { success: false, error: 'Error al crear el equipo' },
      { status: 500 }
    );
  }
}
