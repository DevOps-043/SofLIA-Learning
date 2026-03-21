import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireBusiness } from '@/lib/auth/requireBusiness';
import { logger } from '@/lib/utils/logger';

interface RouteContext {
  params: Promise<{ orgSlug: string }>;
}

/**
 * GET /api/[orgSlug]/business/hierarchy/config
 * Obtiene la configuración de jerarquía de la organización
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

    const { data: org, error } = await supabase
      .from('organizations')
      .select('id, hierarchy_enabled, hierarchy_config')
      .eq('id', auth.organizationId)
      .single();

    if (error || !org) {
      logger.error('Error obteniendo config de jerarquía:', error);
      return NextResponse.json(
        { success: false, error: 'Organización no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      config: {
        hierarchy_enabled: org.hierarchy_enabled ?? false,
        ...(org.hierarchy_config as object || {})
      }
    });
  } catch (error) {
    logger.error('Error en GET /api/[orgSlug]/business/hierarchy/config:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener configuración' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/[orgSlug]/business/hierarchy/config
 * Actualiza la configuración de jerarquía
 */
export async function PUT(request: NextRequest, { params }: RouteContext) {
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

    // Solo el owner o admin puede modificar la configuración
    if (auth.organizationRole !== 'owner' && auth.organizationRole !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Solo el propietario o administrador puede modificar la configuración' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const supabase = await createClient();

    // Preparar los datos a actualizar
    const updateData: Record<string, unknown> = {};

    if (typeof body.hierarchy_enabled === 'boolean') {
      updateData.hierarchy_enabled = body.hierarchy_enabled;
    }

    // Actualizar hierarchy_config con las opciones adicionales
    const configFields = ['labels', 'auto_assign_new_users', 'require_team_assignment'];
    const configUpdate: Record<string, unknown> = {};

    for (const field of configFields) {
      if (body[field] !== undefined) {
        configUpdate[field] = body[field];
      }
    }

    if (Object.keys(configUpdate).length > 0) {
      // Obtener config actual para hacer merge
      const { data: currentOrg } = await supabase
        .from('organizations')
        .select('hierarchy_config')
        .eq('id', auth.organizationId)
        .single();

      updateData.hierarchy_config = {
        ...(currentOrg?.hierarchy_config as object || {}),
        ...configUpdate
      };
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { success: false, error: 'No hay datos para actualizar' },
        { status: 400 }
      );
    }

    const { data: org, error } = await supabase
      .from('organizations')
      .update(updateData)
      .eq('id', auth.organizationId)
      .select('id, hierarchy_enabled, hierarchy_config')
      .single();

    if (error) {
      logger.error('Error actualizando config de jerarquía:', error);
      return NextResponse.json(
        { success: false, error: 'Error al actualizar configuración' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      config: {
        hierarchy_enabled: org.hierarchy_enabled ?? false,
        ...(org.hierarchy_config as object || {})
      }
    });
  } catch (error) {
    logger.error('Error en PUT /api/[orgSlug]/business/hierarchy/config:', error);
    return NextResponse.json(
      { success: false, error: 'Error al actualizar configuración' },
      { status: 500 }
    );
  }
}
