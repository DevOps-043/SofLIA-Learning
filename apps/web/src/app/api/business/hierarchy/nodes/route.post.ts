import { createClient as createServiceClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

import { apiError } from '@/lib/api/errors';
import { withZodBody } from '@/lib/api/with-validation';
import { requireBusiness } from '@/lib/auth/requireBusiness';
import type { BusinessAuth } from '@/lib/auth/requireBusiness';

import { createNodeSchema, type CreateNodeBody } from '../_schemas';
import type {
  OrganizationNodeInsert,
  ParentNodeRow,
  StructureOrganizationRow,
} from './route.post.types';

async function handlePost(_request: NextRequest, body: CreateNodeBody) {
  const auth = await requireBusiness();
  if (auth instanceof NextResponse) return auth;

  const { organizationId } = auth as BusinessAuth;
  if (!organizationId) {
    return apiError('NO_ORGANIZATION', 'Organization ID required', 403);
  }

  const supabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  let path = '';
  let depth = 0;

  const { data: structure } = await supabase
    .from('organization_structures')
    .select('organization_id')
    .eq('id', body.structure_id)
    .single<StructureOrganizationRow>();

  if (!structure) {
    return apiError('STRUCTURE_NOT_FOUND', 'Structure not found', 404);
  }

  if (structure.organization_id !== organizationId) {
    return apiError(
      'UNAUTHORIZED_STRUCTURE',
      'Unauthorized access to this structure',
      403,
    );
  }

  if (body.parent_id) {
    const { data: parent } = await supabase
      .from('organization_nodes')
      .select('path, depth')
      .eq('id', body.parent_id)
      .single<ParentNodeRow>();
    if (!parent) {
      return apiError('PARENT_NOT_FOUND', 'Parent not found', 404);
    }

    const slug = body.name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '');

    path = `${parent.path}.${slug}`;
    depth = parent.depth + 1;
  } else {
    path = 'root';
    depth = 0;
  }

  const insertData: OrganizationNodeInsert = {
    structure_id: body.structure_id,
    parent_id: body.parent_id || null,
    name: body.name,
    type: body.type,
    position: body.position ?? null,
    manager_id: body.manager_id ?? null,
    properties: body.properties ?? body.metadata ?? {},
    organization_id: organizationId,
    path,
    depth,
  };

  const { data, error } = await supabase
    .from('organization_nodes')
    .insert(insertData)
    .select()
    .single();

  if (error) {
    return apiError('CREATE_NODE_FAILED', error.message, 500);
  }
  return NextResponse.json({ data });
}

export const POST = withZodBody(createNodeSchema, handlePost);
