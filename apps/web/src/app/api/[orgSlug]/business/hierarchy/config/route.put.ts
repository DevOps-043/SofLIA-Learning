import { NextRequest, NextResponse } from 'next/server';

import { apiError } from '@/lib/api/errors';
import { withZodBody } from '@/lib/api/with-validation';
import { createClient } from '@/lib/supabase/server';

import { requireBusiness } from '@/lib/auth/requireBusiness';

import { logger } from '@/lib/utils/logger';
import {
  updateHierarchyConfigSchema,
  type UpdateHierarchyConfigBody,
} from '@/app/api/business/hierarchy/_schemas';

interface RouteContext {
  params: Promise<{ orgSlug: string }>;
}

/**
 * PUT /api/[orgSlug]/business/hierarchy/config
 * Actualiza la configuración de jerarquía
 */
async function handlePut(
  _request: NextRequest,
  body: UpdateHierarchyConfigBody,
  { params }: RouteContext,
) {
  try {
    const { orgSlug } = await params;
    const auth = await requireBusiness({ organizationSlug: orgSlug });
    if (auth instanceof NextResponse) return auth;

    if (!auth.organizationId) {
      return apiError('NO_ORGANIZATION', 'No tienes una organización asignada', 403);
    }

    // Solo el owner o admin puede modificar la configuración
    if (auth.organizationRole !== 'owner' && auth.organizationRole !== 'admin') {
      return apiError(
        'FORBIDDEN',
        'Solo el propietario o administrador puede modificar la configuración',
        403,
      );
    }

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
      return apiError('NO_CHANGES', 'No hay datos para actualizar', 400);
    }

    const { data: org, error } = await supabase
      .from('organizations')
      .update(updateData)
      .eq('id', auth.organizationId)
      .select('id, hierarchy_enabled, hierarchy_config')
      .single();

    if (error) {
      logger.error('Error actualizando config de jerarquía:', error);
      return apiError('UPDATE_CONFIG_FAILED', 'Error al actualizar configuración', 500);
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
    return apiError('UPDATE_CONFIG_FAILED', 'Error al actualizar configuración', 500);
  }
}

export const PUT = withZodBody(updateHierarchyConfigSchema, handlePut);
