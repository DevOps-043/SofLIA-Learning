import { NextRequest, NextResponse } from 'next/server';

import { createClient as createServiceClient } from '@supabase/supabase-js';

import { requireBusiness } from '@/lib/auth/requireBusiness';

import { logger } from '@/lib/utils/logger';
import { apiError } from '@/lib/api/errors';
import { withZodBody } from '@/lib/api/with-validation';
import {
  createNodeSchema,
  type CreateNodeBody,
} from '@/app/api/business/hierarchy/_schemas';

interface RouteContext {
  params: Promise<{ orgSlug: string }>;
}

/**
 * POST /api/[orgSlug]/business/hierarchy/nodes
 * Crea un nuevo nodo en la jerarquía dinámica
 */
async function handlePost(
  _request: NextRequest,
  body: CreateNodeBody,
  { params }: RouteContext,
) {
  try {
    const { orgSlug } = await params;
    const auth = await requireBusiness({ organizationSlug: orgSlug });
    if (auth instanceof NextResponse) return auth;

    if (!auth.organizationId) {
      return apiError('NO_ORGANIZATION', 'Organization ID required', 403);
    }

    const supabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1. Verificar que la estructura pertenece a la organización
    const { data: structure } = await supabase
      .from('organization_structures')
      .select('organization_id')
      .eq('id', body.structure_id)
      .single();

    if (!structure) {
      return apiError('STRUCTURE_NOT_FOUND', 'Structure not found', 404);
    }

    if (structure.organization_id !== auth.organizationId) {
      return apiError(
        'UNAUTHORIZED_STRUCTURE',
        'Unauthorized access to this structure',
        403,
      );
    }

    // 2. Calcular Path y Depth
    let path = '';
    let depth = 0;

    if (body.parent_id) {
      const { data: parent } = await supabase
        .from('organization_nodes')
        .select('path, depth')
        .eq('id', body.parent_id)
        .eq('organization_id', auth.organizationId)
        .single();
      
      if (!parent) return apiError('PARENT_NOT_FOUND', 'Parent not found', 404);

      const slug = body.name.toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, '_')
        .replace(/[^a-z0-9_]/g, '');

      path = `${parent.path}.${slug}`;
      depth = parent.depth + 1;
    } else {
      path = 'root';
      depth = 0;
    }

    const { data, error } = await supabase
      .from('organization_nodes')
      .insert({
        structure_id: body.structure_id,
        parent_id: body.parent_id ?? null,
        name: body.name,
        type: body.type,
        position: body.position ?? null,
        manager_id: body.manager_id ?? null,
        properties: body.properties ?? body.metadata ?? {},
        organization_id: auth.organizationId,
        path,
        depth
      })
      .select()
      .single();

    if (error) {
      logger.error('Error creando nodo:', error);
      return apiError('CREATE_NODE_FAILED', error.message, 500);
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    logger.error('Error en POST /api/[orgSlug]/business/hierarchy/nodes:', error);
    return apiError('CREATE_NODE_FAILED', 'Error al crear nodo', 500);
  }
}

export const POST = withZodBody(createNodeSchema, handlePost);
