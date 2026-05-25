import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireBusiness } from '@/lib/auth/requireBusiness';
import { logger } from '@/lib/utils/logger';
import { apiError } from '@/lib/api/errors';
import { withZodBody } from '@/lib/api/with-validation';
import { createZoneSchema, type CreateZoneBody } from '../_schemas';

/**
 * GET /api/business/hierarchy/zones
 * Lista todas las zonas de la organización
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

    // Debug: Log coordenadas de las zonas
    if (zones && zones.length > 0) {
      logger.info('📍 Zonas obtenidas con coordenadas:', zones.map(z => ({
        id: z.id,
        name: z.name,
        latitude: z.latitude,
        longitude: z.longitude,
        latitudeType: typeof z.latitude,
        longitudeType: typeof z.longitude
      })));
    }

    let zonesWithCounts = zones || [];

    if (withCounts && zones && zones.length > 0) {
      const zoneIds = zones.map(z => z.id);

      // Contar equipos por zona
      const { data: teamCounts } = await supabase
        .from('organization_teams')
        .select('zone_id')
        .in('zone_id', zoneIds)
        .eq('is_active', true);

      // Contar usuarios por zona
      const { data: userCounts } = await supabase
        .from('organization_users')
        .select('zone_id')
        .in('zone_id', zoneIds)
        .eq('status', 'active');

      zonesWithCounts = zones.map(zone => ({
        ...zone,
        teams_count: teamCounts?.filter(t => t.zone_id === zone.id).length || 0,
        users_count: userCounts?.filter(u => u.zone_id === zone.id).length || 0
      }));
    }

    return NextResponse.json({
      success: true,
      zones: zonesWithCounts
    });
  } catch (error) {
    logger.error('Error en GET /api/business/hierarchy/zones:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener zonas' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/business/hierarchy/zones
 * Crea una nueva zona
 */
async function handlePost(_request: NextRequest, body: CreateZoneBody) {
  try {
    const auth = await requireBusiness();
    if (auth instanceof NextResponse) return auth;

    if (!auth.organizationId) {
      return apiError('NO_ORGANIZATION', 'No tienes una organización asignada', 403);
    }

    if (auth.organizationRole !== 'owner' && auth.organizationRole !== 'admin') {
      return apiError(
        'FORBIDDEN',
        'Solo el propietario o administrador puede crear zonas',
        403,
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
      return apiError('REGION_NOT_FOUND', 'Región no encontrada', 404);
    }

    const { count: existingCount } = await supabase
      .from('organization_zones')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', auth.organizationId)
      .eq('region_id', body.region_id)
      .ilike('name', body.name.trim());

    if (existingCount && existingCount > 0) {
      return apiError(
        'DUPLICATE_NAME',
        'Ya existe una zona con ese nombre en esta región',
        400,
      );
    }

    const parseLatLng = (value: number | string | null | undefined) => {
      if (value === null || value === undefined || value === '') return null;
      const num = typeof value === 'string' ? parseFloat(value) : value;
      return Number.isNaN(num) ? null : num;
    };

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
        latitude: parseLatLng(body.latitude),
        longitude: parseLatLng(body.longitude),
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
      return apiError('CREATE_ZONE_FAILED', 'Error al crear la zona', 500);
    }

    logger.info('Zona creada:', { zoneId: zone.id, name: zone.name });

    return NextResponse.json({ success: true, zone });
  } catch (error) {
    logger.error('Error en POST /api/business/hierarchy/zones:', error);
    return apiError('CREATE_ZONE_FAILED', 'Error al crear la zona', 500);
  }
}

export const POST = withZodBody(createZoneSchema, handlePost);
