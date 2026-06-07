import { NextRequest, NextResponse } from 'next/server';

import { apiError } from '@/lib/api/errors';
import { withZodBody } from '@/lib/api/with-validation';
import { createAdminClient } from '@/lib/supabase/admin';

import { requireBusiness } from '@/lib/auth/requireBusiness';

import { logger } from '@/lib/utils/logger';
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

    const { data: structure, error } = await supabase
      .from('organization_structures')
      .insert({
        ...body,
        organization_id: auth.organizationId,
        created_by: auth.userId
      })
      .select()
      .single();

    if (error) {
      logger.error('Error creando estructura:', error);
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
