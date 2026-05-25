import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireBusiness } from '@/lib/auth/requireBusiness';
import { logger } from '@/lib/utils/logger';
import { apiError } from '@/lib/api/errors';
import { withZodBody } from '@/lib/api/with-validation';
import {
  updateRegionSchema,
  type UpdateRegionBody,
} from '@/app/api/business/hierarchy/_schemas';

interface RouteContext {
  params: Promise<{ orgSlug: string; regionId: string }>;
}

const parseLatLng = (value: number | string | null | undefined) =>
  value === null || value === undefined || value === ''
    ? null
    : typeof value === 'number'
      ? value
      : parseFloat(value);

/**
 * GET /api/[orgSlug]/business/hierarchy/regions/[regionId]
 * Obtiene una región por ID
 */
export async function GET(request: Request, { params }: RouteContext) {
  try {
    const { orgSlug, regionId } = await params;
    const auth = await requireBusiness({ organizationSlug: orgSlug });
    if (auth instanceof NextResponse) return auth;

    if (!auth.organizationId) {
      return NextResponse.json(
        { success: false, error: 'No tienes una organización asignada' },
        { status: 403 }
      );
    }

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
      return NextResponse.json(
        { success: false, error: 'Región no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      region
    });
  } catch (error) {
    logger.error('Error en GET /api/[orgSlug]/business/hierarchy/regions/[regionId]:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener la región' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/[orgSlug]/business/hierarchy/regions/[regionId]
 * Actualiza una región
 */
async function handlePut(
  _request: NextRequest,
  body: UpdateRegionBody,
  { params }: RouteContext,
) {
  try {
    const { orgSlug, regionId } = await params;
    const auth = await requireBusiness({ organizationSlug: orgSlug });
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

    const supabase = await createClient();

    // Verificar que la región existe y pertenece a la organización
    const { data: existingRegion, error: fetchError } = await supabase
      .from('organization_regions')
      .select('id')
      .eq('id', regionId)
      .eq('organization_id', auth.organizationId)
      .single();

    if (fetchError || !existingRegion) {
      return apiError('REGION_NOT_FOUND', 'Región no encontrada', 404);
    }

    // Si se cambia el nombre, verificar unicidad
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

    // Preparar datos de actualización
    const updateData: Record<string, unknown> = {};
    if (body.name !== undefined) updateData.name = body.name.trim();
    if (body.description !== undefined) updateData.description = body.description?.trim() || null;
    if (body.code !== undefined) updateData.code = body.code?.trim() || null;
    if (typeof body.is_active === 'boolean') updateData.is_active = body.is_active;
    // Ubicación
    if (body.address !== undefined) updateData.address = body.address?.trim() || null;
    if (body.city !== undefined) updateData.city = body.city?.trim() || null;
    if (body.state !== undefined) updateData.state = body.state?.trim() || null;
    if (body.country !== undefined) updateData.country = body.country?.trim() || null;
    if (body.postal_code !== undefined) updateData.postal_code = body.postal_code?.trim() || null;
    if (body.latitude !== undefined) updateData.latitude = parseLatLng(body.latitude);
    if (body.longitude !== undefined) updateData.longitude = parseLatLng(body.longitude);
    // Contacto
    if (body.phone !== undefined) updateData.phone = body.phone?.trim() || null;
    if (body.email !== undefined) updateData.email = body.email?.trim() || null;
    // Gerente
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

    return NextResponse.json({
      success: true,
      region
    });
  } catch (error) {
    logger.error('Error en PUT /api/[orgSlug]/business/hierarchy/regions/[regionId]:', error);
    return apiError('UPDATE_REGION_FAILED', 'Error al actualizar la región', 500);
  }
}

export const PUT = withZodBody(updateRegionSchema, handlePut);

/**
 * DELETE /api/[orgSlug]/business/hierarchy/regions/[regionId]
 * Elimina una región (y sus zonas/equipos en cascada)
 */
export async function DELETE(request: Request, { params }: RouteContext) {
  try {
    const { orgSlug, regionId } = await params;
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
        { success: false, error: 'Solo el propietario o administrador puede eliminar regiones' },
        { status: 403 }
      );
    }

    const supabase = await createClient();

    // Verificar que la región existe
    const { data: existingRegion, error: fetchError } = await supabase
      .from('organization_regions')
      .select('id, name')
      .eq('id', regionId)
      .eq('organization_id', auth.organizationId)
      .single();

    if (fetchError || !existingRegion) {
      return NextResponse.json(
        { success: false, error: 'Región no encontrada' },
        { status: 404 }
      );
    }

    // Verificar si hay usuarios asignados directamente a esta región
    const { count: usersInRegion } = await supabase
      .from('organization_users')
      .select('id', { count: 'exact', head: true })
      .eq('region_id', regionId)
      .eq('status', 'active');

    if (usersInRegion && usersInRegion > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Hay ${usersInRegion} usuario(s) asignados a esta región. Reasígnelos antes de eliminar.`
        },
        { status: 400 }
      );
    }

    // Eliminar la región (las zonas y equipos se eliminan en cascada por FK)
    const { error } = await supabase
      .from('organization_regions')
      .delete()
      .eq('id', regionId);

    if (error) {
      logger.error('Error eliminando región:', error);
      return NextResponse.json(
        { success: false, error: 'Error al eliminar la región' },
        { status: 500 }
      );
    }

    logger.info('Región eliminada:', { regionId, name: existingRegion.name });

    return NextResponse.json({
      success: true,
      message: 'Región eliminada correctamente'
    });
  } catch (error) {
    logger.error('Error en DELETE /api/[orgSlug]/business/hierarchy/regions/[regionId]:', error);
    return NextResponse.json(
      { success: false, error: 'Error al eliminar la región' },
      { status: 500 }
    );
  }
}
