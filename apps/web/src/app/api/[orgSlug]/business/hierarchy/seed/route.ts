import { NextRequest, NextResponse } from 'next/server';
import { requireBusiness } from '@/lib/auth/requireBusiness';
import { logger } from '@/lib/utils/logger';
import { createAdminClient } from '@/lib/supabase/admin';

type AdminClient = ReturnType<typeof createAdminClient>;

interface LegacySeedIds {
  regionId: string;
  zoneId: string;
  teamId: string;
}

interface FullSeedIds extends LegacySeedIds {
  structureId: string;
}

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

    const supabase = createAdminClient();

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

    const { data: existingDefaultStructure } = await supabase
      .from('organization_structures')
      .select('id')
      .eq('organization_id', auth.organizationId)
      .eq('is_default', true)
      .maybeSingle();

    const { data: structure, error: structureError } = await supabase
      .from('organization_structures')
      .insert({
        organization_id: auth.organizationId,
        name: 'Estructura General',
        is_default: !existingDefaultStructure
      })
      .select('id')
      .single();

    if (structureError || !structure) {
      logger.error('Error creando estructura V2 default:', structureError);
      await rollbackLegacySeed(supabase, {
        regionId: region.id,
        zoneId: zone.id,
        teamId: team.id
      });

      return NextResponse.json(
        { success: false, error: 'Error al crear la estructura dinamica' },
        { status: 500 }
      );
    }

    const { data: rootNode, error: rootNodeError } = await supabase
      .from('organization_nodes')
      .insert({
        structure_id: structure.id,
        organization_id: auth.organizationId,
        parent_id: null,
        name: 'General',
        type: 'root',
        properties: {},
        path: 'root',
        depth: 0,
        position: 0
      })
      .select('id')
      .single();

    if (rootNodeError || !rootNode) {
      logger.error('Error creando nodo raiz V2 default:', rootNodeError);
      await rollbackFullSeed(supabase, {
        structureId: structure.id,
        regionId: region.id,
        zoneId: zone.id,
        teamId: team.id
      });

      return NextResponse.json(
        { success: false, error: 'Error al crear el nodo general' },
        { status: 500 }
      );
    }

    const { data: regionNode, error: regionNodeError } = await supabase
      .from('organization_nodes')
      .insert({
        structure_id: structure.id,
        organization_id: auth.organizationId,
        parent_id: rootNode.id,
        name: region.name,
        type: 'region',
        code: region.code,
        properties: { legacy_region_id: region.id },
        path: 'root.region_principal',
        depth: 1,
        position: 0
      })
      .select('id')
      .single();

    if (regionNodeError || !regionNode) {
      logger.error('Error creando nodo region V2 default:', regionNodeError);
      await rollbackFullSeed(supabase, {
        structureId: structure.id,
        regionId: region.id,
        zoneId: zone.id,
        teamId: team.id
      });

      return NextResponse.json(
        { success: false, error: 'Error al crear el nodo de region' },
        { status: 500 }
      );
    }

    const { data: zoneNode, error: zoneNodeError } = await supabase
      .from('organization_nodes')
      .insert({
        structure_id: structure.id,
        organization_id: auth.organizationId,
        parent_id: regionNode.id,
        name: zone.name,
        type: 'zone',
        code: zone.code,
        properties: { legacy_zone_id: zone.id },
        path: 'root.region_principal.zona_general',
        depth: 2,
        position: 0
      })
      .select('id')
      .single();

    if (zoneNodeError || !zoneNode) {
      logger.error('Error creando nodo zona V2 default:', zoneNodeError);
      await rollbackFullSeed(supabase, {
        structureId: structure.id,
        regionId: region.id,
        zoneId: zone.id,
        teamId: team.id
      });

      return NextResponse.json(
        { success: false, error: 'Error al crear el nodo de zona' },
        { status: 500 }
      );
    }

    const { data: teamNode, error: teamNodeError } = await supabase
      .from('organization_nodes')
      .insert({
        structure_id: structure.id,
        organization_id: auth.organizationId,
        parent_id: zoneNode.id,
        name: team.name,
        type: 'team',
        code: team.code,
        properties: { legacy_team_id: team.id },
        path: 'root.region_principal.zona_general.equipo_general',
        depth: 3,
        position: 0
      })
      .select('id')
      .single();

    if (teamNodeError || !teamNode) {
      logger.error('Error creando nodo equipo V2 default:', teamNodeError);
      await rollbackFullSeed(supabase, {
        structureId: structure.id,
        regionId: region.id,
        zoneId: zone.id,
        teamId: team.id
      });

      return NextResponse.json(
        { success: false, error: 'Error al crear el nodo de equipo' },
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
      .select('user_id');

    if (updateError) {
      logger.warn('Advertencia al asignar usuarios:', updateError);
    }

    const nodeUsers = (updatedUsers || [])
      .map((user) => user.user_id)
      .filter((userId): userId is string => Boolean(userId))
      .map((userId) => ({
        node_id: teamNode.id,
        user_id: userId,
        role: 'member',
        is_primary: true
      }));

    if (nodeUsers.length > 0) {
      const { error: nodeUsersError } = await supabase
        .from('organization_node_users')
        .insert(nodeUsers);

      if (nodeUsersError) {
        logger.warn('Advertencia al asignar usuarios al nodo default:', nodeUsersError);
      }
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
          default_team_id: team.id,
          default_structure_id: structure.id,
          default_root_node_id: rootNode.id,
          default_team_node_id: teamNode.id
        }
      })
      .eq('id', auth.organizationId);

    logger.info('Estructura jerárquica default creada:', {
      organizationId: auth.organizationId,
      regionId: region.id,
      zoneId: zone.id,
      teamId: team.id,
      structureId: structure.id,
      rootNodeId: rootNode.id,
      teamNodeId: teamNode.id,
      usersUpdated: updatedUsers?.length || 0
    });

    return NextResponse.json({
      success: true,
      regionId: region.id,
      zoneId: zone.id,
      teamId: team.id,
      structureId: structure.id,
      rootNodeId: rootNode.id,
      teamNodeId: teamNode.id,
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

async function rollbackFullSeed(
  supabase: AdminClient,
  ids: FullSeedIds,
) {
  const { data: nodes } = await supabase
    .from('organization_nodes')
    .select('id')
    .eq('structure_id', ids.structureId)
    .returns<Array<{ id: string }>>();

  const nodeIds = (nodes || []).map((node) => node.id);

  if (nodeIds.length > 0) {
    await supabase
      .from('organization_node_users')
      .delete()
      .in('node_id', nodeIds);
  }

  await supabase
    .from('organization_nodes')
    .delete()
    .eq('structure_id', ids.structureId);

  await supabase
    .from('organization_structures')
    .delete()
    .eq('id', ids.structureId);

  await rollbackLegacySeed(supabase, ids);
}

async function rollbackLegacySeed(
  supabase: AdminClient,
  ids: LegacySeedIds,
) {
  await supabase.from('organization_teams').delete().eq('id', ids.teamId);
  await supabase.from('organization_zones').delete().eq('id', ids.zoneId);
  await supabase.from('organization_regions').delete().eq('id', ids.regionId);
}
