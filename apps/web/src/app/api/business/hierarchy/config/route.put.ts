import { NextRequest, NextResponse } from 'next/server';

import { apiError } from '@/lib/api/errors';
import { withZodBody } from '@/lib/api/with-validation';
import { requireBusiness } from '@/lib/auth/requireBusiness';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

import {
  updateHierarchyConfigSchema,
  type UpdateHierarchyConfigBody,
} from '../_schemas';

async function handlePut(
  _request: NextRequest,
  body: UpdateHierarchyConfigBody,
) {
  try {
    const auth = await requireBusiness();
    if (auth instanceof NextResponse) return auth;

    if (!auth.organizationId) {
      return apiError(
        'NO_ORGANIZATION',
        'No tienes una organización asignada',
        403,
      );
    }

    if (auth.organizationRole !== 'owner' && auth.organizationRole !== 'admin') {
      return apiError(
        'FORBIDDEN',
        'Solo el propietario o administrador puede modificar la configuración',
        403,
      );
    }

    const supabase = await createClient();
    const updateData: Record<string, unknown> = {};

    if (typeof body.hierarchy_enabled === 'boolean') {
      updateData.hierarchy_enabled = body.hierarchy_enabled;
    }

    const configFields = ['labels', 'auto_assign_new_users', 'require_team_assignment'] as const;
    const configUpdate: Record<string, unknown> = {};
    for (const field of configFields) {
      const value = (body as Record<string, unknown>)[field];
      if (value !== undefined) {
        configUpdate[field] = value;
      }
    }

    if (Object.keys(configUpdate).length > 0) {
      const { data: currentOrg } = await supabase
        .from('organizations')
        .select('hierarchy_config')
        .eq('id', auth.organizationId)
        .single();

      updateData.hierarchy_config = {
        ...((currentOrg?.hierarchy_config as object) || {}),
        ...configUpdate,
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
      return apiError(
        'UPDATE_CONFIG_FAILED',
        'Error al actualizar configuración',
        500,
      );
    }

    return NextResponse.json({
      success: true,
      config: {
        hierarchy_enabled: org.hierarchy_enabled ?? false,
        ...((org.hierarchy_config as object) || {}),
      },
    });
  } catch (error) {
    logger.error('Error en PUT /api/business/hierarchy/config:', error);
    return apiError(
      'UPDATE_CONFIG_FAILED',
      'Error al actualizar configuración',
      500,
    );
  }
}

export const PUT = withZodBody(updateHierarchyConfigSchema, handlePut);
