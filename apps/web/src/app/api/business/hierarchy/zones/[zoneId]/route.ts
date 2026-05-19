import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireBusiness } from '@/lib/auth/requireBusiness';
import { logger } from '@/lib/utils/logger';
import { apiError } from '@/lib/api/errors';
import { withZodBody } from '@/lib/api/with-validation';
import { updateZoneSchema, type UpdateZoneBody } from '../../_schemas';

interface RouteParams {
  params: Promise<{ zoneId: string }>;
}

const parseLatLng = (value: number | string | null | undefined) => {
  if (value === null || value === undefined || value === '') return null;
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return Number.isNaN(num) ? null : num;
};

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireBusiness();
    if (auth instanceof NextResponse) return auth;

    if (!auth.organizationId) {
      return apiError('NO_ORGANIZATION', 'No tienes una organización asignada', 403);
    }

    const { zoneId } = await params;
    const supabase = await createClient();

    const { data: zone, error } = await supabase
      .from('organization_zones')
      .select(`*, region:organization_regions!region_id (id, name, code)`)
      .eq('id', zoneId)
      .eq('organization_id', auth.organizationId)
      .single();

    if (error || !zone) {
      return apiError('ZONE_NOT_FOUND', 'Zona no encontrada', 404);
    }

    return NextResponse.json({ success: true, zone });
  } catch (error) {
    logger.error('Error en GET /api/business/hierarchy/zones/[zoneId]:', error);
    return apiError('GET_ZONE_FAILED', 'Error al obtener la zona', 500);
  }
}

async function handlePut(
  _request: NextRequest,
  body: UpdateZoneBody,
  { params }: RouteParams,
) {
  try {
    const auth = await requireBusiness();
    if (auth instanceof NextResponse) return auth;

    if (!auth.organizationId) {
      return apiError('NO_ORGANIZATION', 'No tienes una organización asignada', 403);
    }

    if (auth.organizationRole !== 'owner' && auth.organizationRole !== 'admin') {
      return apiError(
        'FORBIDDEN',
        'Solo el propietario o administrador puede modificar zonas',
        403,
      );
    }

    const { zoneId } = await params;
    const supabase = await createClient();

    const { data: existingZone, error: fetchError } = await supabase
      .from('organization_zones')
      .select('id, region_id')
      .eq('id', zoneId)
      .eq('organization_id', auth.organizationId)
      .single();

    if (fetchError || !existingZone) {
      return apiError('ZONE_NOT_FOUND', 'Zona no encontrada', 404);
    }

    if (body.name) {
      const { count: duplicateCount } = await supabase
        .from('organization_zones')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', auth.organizationId)
        .eq('region_id', existingZone.region_id)
        .ilike('name', body.name.trim())
        .neq('id', zoneId);

      if (duplicateCount && duplicateCount > 0) {
        return apiError(
          'DUPLICATE_NAME',
          'Ya existe una zona con ese nombre en esta región',
          400,
        );
      }
    }

    const updateData: Record<string, unknown> = {};
    if (body.name !== undefined) updateData.name = body.name.trim();
    if (body.description !== undefined)
      updateData.description = body.description?.trim() || null;
    if (body.code !== undefined) updateData.code = body.code?.trim() || null;
    if (typeof body.is_active === 'boolean') updateData.is_active = body.is_active;
    if (body.metadata !== undefined) updateData.metadata = body.metadata;
    if (body.address !== undefined) updateData.address = body.address?.trim() || null;
    if (body.city !== undefined) updateData.city = body.city?.trim() || null;
    if (body.state !== undefined) updateData.state = body.state?.trim() || null;
    if (body.country !== undefined) updateData.country = body.country?.trim() || null;
    if (body.postal_code !== undefined)
      updateData.postal_code = body.postal_code?.trim() || null;
    if (body.latitude !== undefined) updateData.latitude = parseLatLng(body.latitude);
    if (body.longitude !== undefined) updateData.longitude = parseLatLng(body.longitude);
    if (body.phone !== undefined) updateData.phone = body.phone?.trim() || null;
    if (body.email !== undefined) updateData.email = body.email?.trim() || null;
    if (body.manager_id !== undefined) updateData.manager_id = body.manager_id || null;

    if (Object.keys(updateData).length === 0) {
      return apiError('NO_CHANGES', 'No hay datos para actualizar', 400);
    }

    const { data: zone, error } = await supabase
      .from('organization_zones')
      .update(updateData)
      .eq('id', zoneId)
      .select(`*, region:organization_regions!region_id (id, name, code)`)
      .single();

    if (error) {
      logger.error('Error actualizando zona:', error);
      return apiError('UPDATE_ZONE_FAILED', 'Error al actualizar la zona', 500);
    }

    return NextResponse.json({ success: true, zone });
  } catch (error) {
    logger.error('Error en PUT /api/business/hierarchy/zones/[zoneId]:', error);
    return apiError('UPDATE_ZONE_FAILED', 'Error al actualizar la zona', 500);
  }
}

export const PUT = withZodBody(updateZoneSchema, handlePut);

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireBusiness();
    if (auth instanceof NextResponse) return auth;

    if (!auth.organizationId) {
      return apiError('NO_ORGANIZATION', 'No tienes una organización asignada', 403);
    }

    if (auth.organizationRole !== 'owner' && auth.organizationRole !== 'admin') {
      return apiError(
        'FORBIDDEN',
        'Solo el propietario o administrador puede eliminar zonas',
        403,
      );
    }

    const { zoneId } = await params;
    const supabase = await createClient();

    const { data: existingZone, error: fetchError } = await supabase
      .from('organization_zones')
      .select('id, name')
      .eq('id', zoneId)
      .eq('organization_id', auth.organizationId)
      .single();

    if (fetchError || !existingZone) {
      return apiError('ZONE_NOT_FOUND', 'Zona no encontrada', 404);
    }

    const { count: usersInZone } = await supabase
      .from('organization_users')
      .select('id', { count: 'exact', head: true })
      .eq('zone_id', zoneId)
      .eq('status', 'active');

    if (usersInZone && usersInZone > 0) {
      return apiError(
        'ZONE_HAS_USERS',
        `Hay ${usersInZone} usuario(s) asignados a esta zona. Reasígnelos antes de eliminar.`,
        400,
      );
    }

    const { error } = await supabase
      .from('organization_zones')
      .delete()
      .eq('id', zoneId);

    if (error) {
      logger.error('Error eliminando zona:', error);
      return apiError('DELETE_ZONE_FAILED', 'Error al eliminar la zona', 500);
    }

    logger.info('Zona eliminada:', { zoneId, name: existingZone.name });

    return NextResponse.json({
      success: true,
      message: 'Zona eliminada correctamente',
    });
  } catch (error) {
    logger.error('Error en DELETE /api/business/hierarchy/zones/[zoneId]:', error);
    return apiError('DELETE_ZONE_FAILED', 'Error al eliminar la zona', 500);
  }
}
