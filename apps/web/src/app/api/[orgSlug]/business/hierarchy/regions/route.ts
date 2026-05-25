import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireBusiness } from '@/lib/auth/requireBusiness';
import { logger } from '@/lib/utils/logger';
import { apiError } from '@/lib/api/errors';
import { withZodBody } from '@/lib/api/with-validation';
import {
  createRegionSchema,
  type CreateRegionBody,
} from '@/app/api/business/hierarchy/_schemas';

interface RouteContext {
  params: Promise<{ orgSlug: string }>;
}

const parseLatLng = (value: number | string | null | undefined) =>
  value === null || value === undefined || value === ''
    ? null
    : typeof value === 'number'
      ? value
      : parseFloat(value);

/**
 * GET /api/[orgSlug]/business/hierarchy/regions
 * Lista todas las regiones de la organización
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
    const includeInactive = searchParams.get('includeInactive') === 'true';
    const withCounts = searchParams.get('withCounts') === 'true';
    const withManager = searchParams.get('withManager') === 'true';

    const supabase = await createClient();

    // Selección base con todos los campos incluyendo los nuevos
    const selectFields = withManager
      ? `*, manager:users!organization_regions_manager_id_fkey(id, display_name, first_name, last_name, email, profile_picture_url)`
      : '*';

    let query = supabase
      .from('organization_regions')
      .select(selectFields)
      .eq('organization_id', auth.organizationId)
      .order('name', { ascending: true });

    if (!includeInactive) {
      query = query.eq('is_active', true);
    }

    const { data: regions, error } = await query;

    if (error) {
      logger.error('Error obteniendo regiones:', error);
      return NextResponse.json(
        { success: false, error: 'Error al obtener regiones' },
        { status: 500 }
      );
    }

    // Si se solicitan conteos, calcularlos
    let regionsWithCounts = regions || [];

    if (withCounts && regions && regions.length > 0) {
      const regionIds = regions.map(r => r.id);

      // Contar zonas por región
      const { data: zoneCounts } = await supabase
        .from('organization_zones')
        .select('region_id')
        .in('region_id', regionIds)
        .eq('is_active', true);

      // Contar equipos por región (a través de zonas)
      const { data: zones } = await supabase
        .from('organization_zones')
        .select('id, region_id')
        .in('region_id', regionIds);

      const zoneIds = (zones || []).map(z => z.id);

      const { data: teamCounts } = await supabase
        .from('organization_teams')
        .select('zone_id')
        .in('zone_id', zoneIds)
        .eq('is_active', true);

      // Contar usuarios por región
      const { data: userCounts } = await supabase
        .from('organization_users')
        .select('region_id')
        .in('region_id', regionIds)
        .eq('status', 'active');

      // Agregar conteos a cada región
      regionsWithCounts = regions.map(region => {
        const zonesInRegion = zoneCounts?.filter(z => z.region_id === region.id) || [];
        const zoneIdsInRegion = (zones || []).filter(z => z.region_id === region.id).map(z => z.id);
        const teamsInZones = teamCounts?.filter(t => zoneIdsInRegion.includes(t.zone_id)) || [];
        const usersInRegion = userCounts?.filter(u => u.region_id === region.id) || [];

        return {
          ...region,
          zones_count: zonesInRegion.length,
          teams_count: teamsInZones.length,
          users_count: usersInRegion.length
        };
      });
    }

    return NextResponse.json({
      success: true,
      regions: regionsWithCounts
    });
  } catch (error) {
    logger.error('Error en GET /api/[orgSlug]/business/hierarchy/regions:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener regiones' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/[orgSlug]/business/hierarchy/regions
 * Crea una nueva región
 */
async function handlePost(
  _request: NextRequest,
  body: CreateRegionBody,
  { params }: RouteContext,
) {
  try {
    const { orgSlug } = await params;
    const auth = await requireBusiness({ organizationSlug: orgSlug });
    if (auth instanceof NextResponse) return auth;

    if (!auth.organizationId) {
      return apiError('NO_ORGANIZATION', 'No tienes una organización asignada', 403);
    }

    // Solo owner o admin puede crear regiones
    if (auth.organizationRole !== 'owner' && auth.organizationRole !== 'admin') {
      return apiError(
        'FORBIDDEN',
        'Solo el propietario o administrador puede crear regiones',
        403,
      );
    }

    const supabase = await createClient();

    // Verificar nombre único
    const { count: existingCount } = await supabase
      .from('organization_regions')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', auth.organizationId)
      .ilike('name', body.name.trim());

    if (existingCount && existingCount > 0) {
      return apiError('DUPLICATE_NAME', 'Ya existe una región con ese nombre', 400);
    }

    const { data: region, error } = await supabase
      .from('organization_regions')
      .insert({
        organization_id: auth.organizationId,
        name: body.name.trim(),
        description: body.description?.trim() || null,
        code: body.code?.trim() || null,
        // Ubicación
        address: body.address?.trim() || null,
        city: body.city?.trim() || null,
        state: body.state?.trim() || null,
        country: body.country?.trim() || 'México',
        postal_code: body.postal_code?.trim() || null,
        latitude: parseLatLng(body.latitude),
        longitude: parseLatLng(body.longitude),
        // Contacto
        phone: body.phone?.trim() || null,
        email: body.email?.trim() || null,
        // Gerente
        manager_id: body.manager_id || null,
        metadata: body.metadata || {},
        created_by: auth.userId
      })
      .select(`*, manager:users!organization_regions_manager_id_fkey(id, display_name, first_name, last_name, email, profile_picture_url)`)
      .single();

    if (error) {
      logger.error('Error creando región:', error);
      return apiError('CREATE_REGION_FAILED', 'Error al crear la región', 500);
    }

    logger.info('Región creada:', { regionId: region.id, name: region.name });

    return NextResponse.json({
      success: true,
      region
    });
  } catch (error) {
    logger.error('Error en POST /api/[orgSlug]/business/hierarchy/regions:', error);
    return apiError('CREATE_REGION_FAILED', 'Error al crear la región', 500);
  }
}

export const POST = withZodBody(createRegionSchema, handlePost);
