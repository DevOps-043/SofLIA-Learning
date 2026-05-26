import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireBusiness } from '@/lib/auth/requireBusiness';
import { logger } from '@/lib/utils/logger';
import { SELECT_COLUMNS } from '@/lib/supabase/select-types';

interface RouteContext {
  params: Promise<{ orgSlug: string }>;
}

type TeamWithMembersCount = Record<string, unknown> & {
  id: string;
  zone_id: string;
  members_count: number;
};

type ZoneWithTeams = Record<string, unknown> & {
  id: string;
  region_id: string;
  teams_count: number;
  users_count: number;
  teams: TeamWithMembersCount[];
};

/**
 * GET /api/[orgSlug]/business/hierarchy/full
 * Obtiene la jerarquía completa en estructura de árbol
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

    const supabase = await createClient();

    // Obtener todas las regiones con sus zonas y equipos
    const { data: regions, error: regionsError } = await supabase
      .from('organization_regions')
      .select(SELECT_COLUMNS.organization_regions)
      .eq('organization_id', auth.organizationId)
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (regionsError) {
      logger.error('Error obteniendo regiones:', regionsError);
      return NextResponse.json(
        { success: false, error: 'Error al obtener la jerarquía' },
        { status: 500 }
      );
    }

    const { data: zones, error: zonesError } = await supabase
      .from('organization_zones')
      .select(SELECT_COLUMNS.organization_zones)
      .eq('organization_id', auth.organizationId)
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (zonesError) {
      logger.error('Error obteniendo zonas:', zonesError);
      return NextResponse.json(
        { success: false, error: 'Error al obtener la jerarquía' },
        { status: 500 }
      );
    }

    const { data: teams, error: teamsError } = await supabase
      .from('organization_teams')
      .select(SELECT_COLUMNS.organization_teams)
      .eq('organization_id', auth.organizationId)
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (teamsError) {
      logger.error('Error obteniendo equipos:', teamsError);
      return NextResponse.json(
        { success: false, error: 'Error al obtener la jerarquía' },
        { status: 500 }
      );
    }

    // Obtener conteo de usuarios por equipo
    const { data: userCounts } = await supabase
      .from('organization_users')
      .select('team_id')
      .eq('organization_id', auth.organizationId)
      .eq('status', 'active')
      .not('team_id', 'is', null);

    // Construir el árbol
    const teamsByZone = new Map<string, TeamWithMembersCount[]>();
    const zonesByRegion = new Map<string, ZoneWithTeams[]>();

    // Agrupar equipos por zona con conteo de miembros
    (teams || []).forEach(team => {
      const zoneTeams = teamsByZone.get(team.zone_id) || [];
      zoneTeams.push({
        ...team,
        members_count: userCounts?.filter(u => u.team_id === team.id).length || 0
      });
      teamsByZone.set(team.zone_id, zoneTeams);
    });

    // Agrupar zonas por región con equipos
    (zones || []).forEach(zone => {
      const regionZones = zonesByRegion.get(zone.region_id) || [];
      const zoneTeams = teamsByZone.get(zone.id) || [];
      regionZones.push({
        ...zone,
        teams: zoneTeams,
        teams_count: zoneTeams.length,
        users_count: zoneTeams.reduce((acc, t) => acc + (t.members_count || 0), 0)
      });
      zonesByRegion.set(zone.region_id, regionZones);
    });

    // Construir árbol final con regiones
    const hierarchyTree = (regions || []).map(region => {
      const regionZones = zonesByRegion.get(region.id) || [];
      return {
        ...region,
        zones: regionZones,
        zones_count: regionZones.length,
        teams_count: regionZones.reduce((acc, z) => acc + (z.teams_count || 0), 0),
        users_count: regionZones.reduce((acc, z) => acc + (z.users_count || 0), 0)
      };
    });

    return NextResponse.json({
      success: true,
      regions: hierarchyTree
    });
  } catch (error) {
    logger.error('Error en GET /api/[orgSlug]/business/hierarchy/full:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener la jerarquía' },
      { status: 500 }
    );
  }
}
