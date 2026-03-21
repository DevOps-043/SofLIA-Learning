import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireBusiness } from '@/lib/auth/requireBusiness';
import { logger } from '@/lib/utils/logger';

interface RouteContext {
  params: Promise<{ orgSlug: string }>;
}

/**
 * POST /api/[orgSlug]/business/hierarchy/seed
 * Crea la estructura jerárquica default (1 región, 1 zona, 1 equipo)
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

    // Solo el owner o admin puede crear la estructura
    if (auth.organizationRole !== 'owner' && auth.organizationRole !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Solo el propietario o administrador puede crear la estructura' },
        { status: 403 }
      );
    }

    const supabase = await createClient();

    // Verificar que no exista estructura previa
    const { count: existingRegions } = await supabase
      .from('organization_regions')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', auth.organizationId);

    if (existingRegions && existingRegions > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'La organización ya tiene una estructura jerárquica'
        },
        { status: 400 }
      );
    }

    // 1. Crear Región default
    const { data: region, error: regionError } = await supabase
      .from('organization_regions')
      .insert({
        organization_id: auth.organizationId,
        name: 'Región Principal',
        description: 'Región creada automáticamente como estructura inicial',
        code: 'REG-DEFAULT',
        is_active: true,
        created_by: auth.userId
      })
      .select()
      .single();

    if (regionError || !region) {
      logger.error('Error creando región default:', regionError);
      return NextResponse.json(
        { success: false, error: 'Error al crear la región' },
        { status: 500 }
      );
    }

    // 2. Crear Zona default
    const { data: zone, error: zoneError } = await supabase
      .from('organization_zones')
      .insert({
        organization_id: auth.organizationId,
        region_id: region.id,
        name: 'Zona General',
        description: 'Zona creada automáticamente como estructura inicial',
        code: 'ZONE-DEFAULT',
        is_active: true,
        created_by: auth.userId
      })
      .select()
      .single();

    if (zoneError || !zone) {
      logger.error('Error creando zona default:', zoneError);
      // Rollback: eliminar región
      await supabase
        .from('organization_regions')
        .delete()
        .eq('id', region.id);

      return NextResponse.json(
        { success: false, error: 'Error al crear la zona' },
        { status: 500 }
      );
    }

    // 3. Crear Equipo default
    const { data: team, error: teamError } = await supabase
      .from('organization_teams')
      .insert({
        organization_id: auth.organizationId,
        zone_id: zone.id,
        name: 'Equipo General',
        description: 'Equipo creado automáticamente como estructura inicial',
        code: 'TEAM-DEFAULT',
        is_active: true,
        created_by: auth.userId
      })
      .select()
      .single();

    if (teamError || !team) {
      logger.error('Error creando equipo default:', teamError);
      // Rollback: eliminar zona y región
      await supabase.from('organization_zones').delete().eq('id', zone.id);
      await supabase.from('organization_regions').delete().eq('id', region.id);

      return NextResponse.json(
        { success: false, error: 'Error al crear el equipo' },
        { status: 500 }
      );
    }

    // 4. Asignar usuarios existentes al equipo default (excepto owners)
    const { data: updatedUsers, error: updateError } = await supabase
      .from('organization_users')
      .update({
        team_id: team.id,
        zone_id: zone.id,
        region_id: region.id,
        hierarchy_scope: 'team'
      })
      .eq('organization_id', auth.organizationId)
      .eq('status', 'active')
      .neq('role', 'owner')
      .is('team_id', null)
      .select('id');

    if (updateError) {
      logger.warn('Advertencia al asignar usuarios:', updateError);
    }

    // 5. Asegurar que el owner tenga scope organization
    await supabase
      .from('organization_users')
      .update({ hierarchy_scope: 'organization' })
      .eq('organization_id', auth.organizationId)
      .eq('role', 'owner');

    // 6. Guardar IDs de estructura default en config
    const { data: currentOrg } = await supabase
      .from('organizations')
      .select('hierarchy_config')
      .eq('id', auth.organizationId)
      .single();

    await supabase
      .from('organizations')
      .update({
        hierarchy_config: {
          ...(currentOrg?.hierarchy_config as object || {}),
          default_region_id: region.id,
          default_zone_id: zone.id,
          default_team_id: team.id
        }
      })
      .eq('id', auth.organizationId);

    logger.info('Estructura jerárquica default creada:', {
      organizationId: auth.organizationId,
      regionId: region.id,
      zoneId: zone.id,
      teamId: team.id,
      usersUpdated: updatedUsers?.length || 0
    });

    return NextResponse.json({
      success: true,
      regionId: region.id,
      zoneId: zone.id,
      teamId: team.id,
      usersUpdated: updatedUsers?.length || 0,
      message: 'Estructura jerárquica creada correctamente'
    });
  } catch (error) {
    logger.error('Error en POST /api/[orgSlug]/business/hierarchy/seed:', error);
    return NextResponse.json(
      { success: false, error: 'Error al crear la estructura' },
      { status: 500 }
    );
  }
}
