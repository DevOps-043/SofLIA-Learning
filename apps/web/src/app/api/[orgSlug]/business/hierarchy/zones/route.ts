import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireBusiness } from '@/lib/auth/requireBusiness';
import { logger } from '@/lib/utils/logger';

interface RouteContext {
  params: Promise<{ orgSlug: string }>;
}

interface OrganizationZoneRow {
  id: string;
  [key: string]: unknown;
}

interface ZoneCountRow {
  zone_id: string | null;
}

/**
 * GET /api/[orgSlug]/business/hierarchy/zones
 * Lista todas las zonas de la organización
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
    const regionId = searchParams.get('regionId');
    const includeInactive = searchParams.get('includeInactive') === 'true';
    const withCounts = searchParams.get('withCounts') === 'true';

    const supabase = await createClient();

    let query = supabase
      .from('organization_zones')
      .select(`
        *,
        region:organization_regions!region_id (
          id,
          name,
          code
        )
      `)
      .eq('organization_id', auth.organizationId)
      .order('name', { ascending: true });

    if (regionId) {
      query = query.eq('region_id', regionId);
    }

    if (!includeInactive) {
      query = query.eq('is_active', true);
    }

    const { data: zones, error } = await query;

    if (error) {
      logger.error('Error obteniendo zonas:', error);
      return NextResponse.json(
        { success: false, error: 'Error al obtener zonas' },
        { status: 500 }
      );
    }

    let zonesWithCounts = (zones || []) as OrganizationZoneRow[];

    if (withCounts && zones && zones.length > 0) {
      const zoneIds = zones.map((zone) => zone.id);

      // Contar equipos por zona
      const { data: teamCounts } = await supabase
        .from('organization_teams')
        .select('zone_id')
        .in('zone_id', zoneIds)
        .eq('is_active', true)
        .returns<ZoneCountRow[]>();

      // Contar usuarios por zona
      const { data: userCounts } = await supabase
        .from('organization_users')
        .select('zone_id')
        .in('zone_id', zoneIds)
        .eq('status', 'active')
        .returns<ZoneCountRow[]>();

      zonesWithCounts = zones.map((zone) => ({
        ...zone,
        teams_count: teamCounts?.filter((team) => team.zone_id === zone.id).length || 0,
        users_count: userCounts?.filter((user) => user.zone_id === zone.id).length || 0
      }));
    }

    return NextResponse.json({
      success: true,
      zones: zonesWithCounts
    });
  } catch (error) {
    logger.error('Error en GET /api/[orgSlug]/business/hierarchy/zones:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener zonas' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/[orgSlug]/business/hierarchy/zones
 * Crea una nueva zona
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
        { success: false, error: 'Solo el propietario o administrador puede crear zonas' },
        { status: 403 }
      );
    }

    const body = await request.json();

    if (!body.region_id) {
      return NextResponse.json(
        { success: false, error: 'La región es requerida' },
        { status: 400 }
      );
    }

    if (!body.name || typeof body.name !== 'string' || body.name.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'El nombre de la zona es requerido' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Verificar que la región existe y pertenece a la organización
    const { data: region, error: regionError } = await supabase
      .from('organization_regions')
      .select('id')
      .eq('id', body.region_id)
      .eq('organization_id', auth.organizationId)
      .single();

    if (regionError || !region) {
      return NextResponse.json(
        { success: false, error: 'Región no encontrada' },
        { status: 404 }
      );
    }

    // Verificar nombre único dentro de la región
    const { count: existingCount } = await supabase
      .from('organization_zones')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', auth.organizationId)
      .eq('region_id', body.region_id)
      .ilike('name', body.name.trim());

    if (existingCount && existingCount > 0) {
      return NextResponse.json(
        { success: false, error: 'Ya existe una zona con ese nombre en esta región' },
        { status: 400 }
      );
    }

    const { data: zone, error } = await supabase
      .from('organization_zones')
      .insert({
        organization_id: auth.organizationId,
        region_id: body.region_id,
        name: body.name.trim(),
        description: body.description?.trim() || null,
        code: body.code?.trim() || null,
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
        // Gerente
        manager_id: body.manager_id || null
      })
      .select(`
        *,
        region:organization_regions!region_id (
          id,
          name,
          code
        )
      `)
      .single();

    if (error) {
      logger.error('Error creando zona:', error);
      return NextResponse.json(
        { success: false, error: 'Error al crear la zona' },
        { status: 500 }
      );
    }

    logger.info('Zona creada:', { zoneId: zone.id, name: zone.name });

    return NextResponse.json({
      success: true,
      zone
    });
  } catch (error) {
    logger.error('Error en POST /api/[orgSlug]/business/hierarchy/zones:', error);
    return NextResponse.json(
      { success: false, error: 'Error al crear la zona' },
      { status: 500 }
    );
  }
}
