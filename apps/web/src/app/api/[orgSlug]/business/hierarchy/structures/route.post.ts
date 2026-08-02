import { NextRequest, NextResponse } from 'next/server';

import { apiError } from '@/lib/api/errors';
import { withZodBody } from '@/lib/api/with-validation';
import { createAdminClient } from '@/lib/supabase/admin';

import { requireBusiness } from '@/lib/auth/requireBusiness';

import { logger } from '@/lib/utils/logger';
import { SELECT_COLUMNS } from '@/lib/supabase/select-types';
import type { Json } from '@/lib/supabase/types';
import {
  createStructureSchema,
  type CreateStructureBody,
} from '@/app/api/business/hierarchy/_schemas';

interface RouteContext {
  params: Promise<{ orgSlug: string }>;
}

/**
 * POST /api/[orgSlug]/business/hierarchy/structures
 * Crea una nueva estructura jerárquica
 */
async function handlePost(
  _request: NextRequest,
  body: CreateStructureBody,
  { params }: RouteContext,
) {
  try {
    const { orgSlug } = await params;
    const auth = await requireBusiness({ organizationSlug: orgSlug });
    if (auth instanceof NextResponse) return auth;

    if (!auth.organizationId) {
      return apiError('NO_ORGANIZATION', 'No tienes una organización asignada', 403);
    }

    const supabase = createAdminClient();

    const { data: existingDefault, error: defaultError } = await supabase
      .from('organization_structures')
      .select('id')
      .eq('organization_id', auth.organizationId)
      .eq('is_default', true)
      .limit(1)
      .maybeSingle();

    if (defaultError) {
      logger.error('Error resolviendo estructura default:', {
        code: defaultError.code,
        message: defaultError.message,
      });
      return apiError('CREATE_STRUCTURE_FAILED', 'Error al resolver la estructura activa', 500);
    }

    const { data: structure, error } = await supabase
      .from('organization_structures')
      .insert({
        name: body.name,
        description: body.description ?? null,
        template: body.template ?? null,
        metadata: (body.metadata ?? null) as Json,
        organization_id: auth.organizationId,
        created_by: auth.userId,
        is_default: !existingDefault,
      })
      .select(SELECT_COLUMNS.organization_structures)
      .single();

    if (error) {
      logger.error('Error creando estructura:', { code: error.code, message: error.message });
      return apiError('CREATE_STRUCTURE_FAILED', 'Error al crear estructura', 500);
    }

    return NextResponse.json({
      success: true,
      structure
    });
  } catch (error) {
    logger.error('Error en POST /api/[orgSlug]/business/hierarchy/structures:', error);
    return apiError('CREATE_STRUCTURE_FAILED', 'Error al crear estructura', 500);
  }
}

export const POST = withZodBody(createStructureSchema, handlePost);
