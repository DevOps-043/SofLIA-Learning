import { NextRequest, NextResponse } from 'next/server';

import { apiError } from '@/lib/api/errors';
import { withZodBody } from '@/lib/api/with-validation';
import { requireBusiness } from '@/lib/auth/requireBusiness';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

import { moveNodeSchema, type MoveNodeBody } from '../../../_schemas';

type RouteContext = { params: Promise<{ nodeId: string }> };

async function handlePost(
  _request: NextRequest,
  body: MoveNodeBody,
  { params }: RouteContext,
) {
  try {
    const auth = await requireBusiness();
    if (auth instanceof NextResponse) return auth;

    const supabase = await createClient();
    const { nodeId } = await params;
    const new_parent_id = body.new_parent_id ?? null;

    const { data: node } = await supabase
      .from('organization_nodes')
      .select('id, name, path, depth')
      .eq('id', nodeId)
      .eq('organization_id', auth.organizationId)
      .single();

    if (!node) return apiError('NODE_NOT_FOUND', 'Node not found', 404);

    const slugify = (value: string) =>
      value
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/\s+/g, '_')
        .replace(/[^a-z0-9_]/g, '');

    let newPath = 'root';
    let newDepth = 0;

    if (new_parent_id) {
      const { data: parent } = await supabase
        .from('organization_nodes')
        .select('id, name, path, depth')
        .eq('id', new_parent_id)
        .eq('organization_id', auth.organizationId)
        .single();

      if (!parent) return apiError('PARENT_NOT_FOUND', 'Parent not found', 404);

      if (parent.path.startsWith(node.path)) {
        return apiError(
          'CIRCULAR_MOVE',
          'Cannot move node into its own descendant',
          400,
        );
      }

      const slug = slugify(node.name);
      newPath = `${parent.path}.${slug}`;
      newDepth = parent.depth + 1;
    } else {
      const slug = slugify(node.name);
      newPath = `root.${slug}`;
      newDepth = 0;
    }

    const { data: descendants } = await supabase
      .from('organization_nodes')
      .select('id, path')
      .like('path', `${node.path}.%`)
      .eq('organization_id', auth.organizationId);

    const { error: updateError } = await supabase
      .from('organization_nodes')
      .update({ parent_id: new_parent_id, path: newPath, depth: newDepth })
      .eq('id', nodeId);

    if (updateError) {
      return apiError('MOVE_NODE_FAILED', updateError.message, 500);
    }

    if (descendants && descendants.length > 0) {
      for (const desc of descendants) {
        const newDescPath = desc.path.replace(node.path, newPath);
        const newDescDepth = newDescPath.split('.').length - 1;
        await supabase
          .from('organization_nodes')
          .update({ path: newDescPath, depth: newDescDepth })
          .eq('id', desc.id);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Error in move:', error);
    return apiError('INTERNAL_ERROR', 'Internal Server Error', 500);
  }
}

export const POST = withZodBody(moveNodeSchema, handlePost);
