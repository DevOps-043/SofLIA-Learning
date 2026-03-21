import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireBusiness } from '@/lib/auth/requireBusiness';
import { logger } from '@/lib/utils/logger';

interface RouteContext {
  params: Promise<{ orgSlug: string }>;
}

/**
 * GET /api/[orgSlug]/business/hierarchy/stats
 * Obtiene estadísticas de la estructura jerárquica
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

    // Ejecutar todas las consultas en paralelo
    const [
      orgResult,
      regionsResult,
      zonesResult,
      teamsResult,
      assignedUsersResult,
      unassignedUsersResult
    ] = await Promise.all([
      // Configuración de la organización
      supabase
        .from('organizations')
        .select('hierarchy_enabled')
        .eq('id', auth.organizationId)
        .single(),

      // Contar regiones activas
      supabase
        .from('organization_regions')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', auth.organizationId)
        .eq('is_active', true),

      // Contar zonas activas
      supabase
        .from('organization_zones')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', auth.organizationId)
        .eq('is_active', true),

      // Contar equipos activos
      supabase
        .from('organization_teams')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', auth.organizationId)
        .eq('is_active', true),

      // Contar usuarios asignados a equipo
      supabase
        .from('organization_users')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', auth.organizationId)
        .eq('status', 'active')
        .not('team_id', 'is', null),

      // Contar usuarios sin asignar (excluyendo owners)
      supabase
        .from('organization_users')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', auth.organizationId)
        .eq('status', 'active')
        .neq('role', 'owner')
        .is('team_id', null)
    ]);

    const stats = {
      hierarchy_enabled: orgResult.data?.hierarchy_enabled ?? false,
      regions_count: regionsResult.count ?? 0,
      zones_count: zonesResult.count ?? 0,
      teams_count: teamsResult.count ?? 0,
      users_assigned: assignedUsersResult.count ?? 0,
      users_unassigned: unassignedUsersResult.count ?? 0
    };

    return NextResponse.json({
      success: true,
      stats
    });
  } catch (error) {
    logger.error('Error en GET /api/[orgSlug]/business/hierarchy/stats:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener estadísticas' },
      { status: 500 }
    );
  }
}
