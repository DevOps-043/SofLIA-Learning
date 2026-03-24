import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireBusiness } from '@/lib/auth/requireBusiness';
import { logger } from '@/lib/utils/logger';

interface RouteContext {
  params: Promise<{ orgSlug: string }>;
}

/**
 * POST /api/[orgSlug]/business/hierarchy/enable
 * Activa la jerarquía para la organización
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

    // Solo el owner o admin puede activar la jerarquía
    if (auth.organizationRole !== 'owner' && auth.organizationRole !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Solo el propietario o administrador puede activar la jerarquía' },
        { status: 403 }
      );
    }

    const supabase = await createClient();

    // Verificar que existe al menos un equipo
    const { count: teamsCount } = await supabase
      .from('organization_teams')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', auth.organizationId)
      .eq('is_active', true);

    if (!teamsCount || teamsCount === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Debe crear al menos un equipo antes de activar la jerarquía'
        },
        { status: 400 }
      );
    }

    // Verificar que todos los usuarios (excepto owner) tienen equipo asignado
    const { count: usersWithoutTeam } = await supabase
      .from('organization_users')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', auth.organizationId)
      .eq('status', 'active')
      .neq('role', 'owner')
      .is('team_id', null);

    if (usersWithoutTeam && usersWithoutTeam > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Hay ${usersWithoutTeam} usuario(s) sin equipo asignado. Asígnelos antes de activar la jerarquía.`
        },
        { status: 400 }
      );
    }

    // Activar la jerarquía
    const { error } = await supabase
      .from('organizations')
      .update({ hierarchy_enabled: true })
      .eq('id', auth.organizationId);

    if (error) {
      logger.error('Error activando jerarquía:', error);
      return NextResponse.json(
        { success: false, error: 'Error al activar la jerarquía' },
        { status: 500 }
      );
    }

    // Asegurar que el owner tenga scope de organización
    await supabase
      .from('organization_users')
      .update({ hierarchy_scope: 'organization' })
      .eq('organization_id', auth.organizationId)
      .eq('role', 'owner');

    logger.info('Jerarquía activada para organización:', auth.organizationId);

    return NextResponse.json({
      success: true,
      enabled: true,
      message: 'Jerarquía activada correctamente'
    });
  } catch (error) {
    logger.error('Error en POST /api/[orgSlug]/business/hierarchy/enable:', error);
    return NextResponse.json(
      { success: false, error: 'Error al activar la jerarquía' },
      { status: 500 }
    );
  }
}
