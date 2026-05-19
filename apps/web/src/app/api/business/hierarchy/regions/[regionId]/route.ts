import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireBusiness } from '@/lib/auth/requireBusiness';
import { logger } from '@/lib/utils/logger';
import { apiError } from '@/lib/api/errors';
import { withZodBody } from '@/lib/api/with-validation';
import { updateRegionSchema, type UpdateRegionBody } from '../../_schemas';

interface RouteParams {
  params: Promise<{ regionId: string }>;
}

const parseLatLng = (value: number | string | null | undefined) =>
  value === null || value === undefined || value === ''
    ? null
    : typeof value === 'number'
      ? value
      : parseFloat(value);

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireBusiness();
    if (auth instanceof NextResponse) return auth;

    if (!auth.organizationId) {
      return apiError('NO_ORGANIZATION', 'No tienes una organización asignada', 403);
    }

    const { regionId } = await params;
    const { searchParams } = new URL(request.url);
    const withManager = searchParams.get('withManager') !== 'false';
    const supabase = await createClient();

    const selectFields = withManager
      ? `*, manager:users!organization_regions_manager_id_fkey(id, display_name, first_name, last_name, email, profile_picture_url)`
      : '*';

    const { data: region, error } = await supabase
      .from('organization_regions')
      .select(selectFields)
      .eq('id', regionId)
      .eq('organization_id', auth.organizationId)
      .single();

    if (error || !region) {
      return apiError('REGION_NOT_FOUND', 'Región no encontrada', 404);
    }

    return NextResponse.json({ success: true, region });
  } catch (error) {
    logger.error('Error en GET /api/business/hierarchy/regions/[regionId]:', error);
    return apiError('GET_REGION_FAILED', 'Error al obtener la región', 500);
  }
}

async function handlePut(
  _request: NextRequest,
  body: UpdateRegionBody,
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
        'Solo el propietario o administrador puede modificar regiones',
        403,
      );
    }

    const { regionId } = await params;
    const supabase = await createClient();

    const { data: existingRegion, error: fetchError } = await supabase
      .from('organization_regions')
      .select('id')
      .eq('id', regionId)
      .eq('organization_id', auth.organizationId)
      .single();

    if (fetchError || !existingRegion) {
      return apiError('REGION_NOT_FOUND', 'Región no encontrada', 404);
    }

    if (body.name) {
      const { count: duplicateCount } = await supabase
        .from('organization_regions')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', auth.organizationId)
        .ilike('name', body.name.trim())
        .neq('id', regionId);

      if (duplicateCount && duplicateCount > 0) {
        return apiError('DUPLICATE_NAME', 'Ya existe una región con ese nombre', 400);
      }
    }

    const updateData: Record<string, unknown> = {};
    if (body.name !== undefined) updateData.name = body.name.trim();
    if (body.description !== undefined)
      updateData.description = body.description?.trim() || null;
    if (body.code !== undefined) updateData.code = body.code?.trim() || null;
    if (typeof body.is_active === 'boolean') updateData.is_active = body.is_active;
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
    if (body.metadata !== undefined) updateData.metadata = body.metadata;

    if (Object.keys(updateData).length === 0) {
      return apiError('NO_CHANGES', 'No hay datos para actualizar', 400);
    }

    const { data: region, error } = await supabase
      .from('organization_regions')
      .update(updateData)
      .eq('id', regionId)
      .select(`*, manager:users!organization_regions_manager_id_fkey(id, display_name, first_name, last_name, email, profile_picture_url)`)
      .single();

    if (error) {
      logger.error('Error actualizando región:', error);
      return apiError('UPDATE_REGION_FAILED', 'Error al actualizar la región', 500);
    }

    logger.info('Región actualizada:', { regionId, changes: Object.keys(updateData) });

    return NextResponse.json({ success: true, region });
  } catch (error) {
    logger.error('Error en PUT /api/business/hierarchy/regions/[regionId]:', error);
    return apiError('UPDATE_REGION_FAILED', 'Error al actualizar la región', 500);
  }
}

export const PUT = withZodBody(updateRegionSchema, handlePut);

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
        'Solo el propietario o administrador puede eliminar regiones',
        403,
      );
    }

    const { regionId } = await params;
    const supabase = await createClient();

    const { data: existingRegion, error: fetchError } = await supabase
      .from('organization_regions')
      .select('id, name')
      .eq('id', regionId)
      .eq('organization_id', auth.organizationId)
      .single();

    if (fetchError || !existingRegion) {
      return apiError('REGION_NOT_FOUND', 'Región no encontrada', 404);
    }

    const { count: usersInRegion } = await supabase
      .from('organization_users')
      .select('id', { count: 'exact', head: true })
      .eq('region_id', regionId)
      .eq('status', 'active');

    if (usersInRegion && usersInRegion > 0) {
      return apiError(
        'REGION_HAS_USERS',
        `Hay ${usersInRegion} usuario(s) asignados a esta región. Reasígnelos antes de eliminar.`,
        400,
      );
    }

    const { error } = await supabase
      .from('organization_regions')
      .delete()
      .eq('id', regionId);

    if (error) {
      logger.error('Error eliminando región:', error);
      return apiError('DELETE_REGION_FAILED', 'Error al eliminar la región', 500);
    }

    logger.info('Región eliminada:', { regionId, name: existingRegion.name });

    return NextResponse.json({
      success: true,
      message: 'Región eliminada correctamente',
    });
  } catch (error) {
    logger.error('Error en DELETE /api/business/hierarchy/regions/[regionId]:', error);
    return apiError('DELETE_REGION_FAILED', 'Error al eliminar la región', 500);
  }
}
