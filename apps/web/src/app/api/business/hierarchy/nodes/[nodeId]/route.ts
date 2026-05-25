import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';

import { apiError } from '@/lib/api/errors';
import { withZodBody } from '@/lib/api/with-validation';
import { requireBusiness } from '@/lib/auth/requireBusiness';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

import { updateNodeSchema, type UpdateNodeBody } from '../../_schemas';

type RouteContext = { params: Promise<{ nodeId: string }> };

export async function GET(_request: NextRequest, { params }: RouteContext) {
  try {
    const auth = await requireBusiness();
    if (auth instanceof NextResponse) return auth;

    const supabase = await createClient();
    const { nodeId } = await params;
    if (!nodeId) {
      return apiError('NODE_ID_REQUIRED', 'Node ID is required', 400);
    }

    const { data: node, error: nodeError } = await supabase
      .from('organization_nodes')
      .select(
        `*, manager:users!manager_id (id, email, first_name, last_name, profile_picture_url, display_name)`,
      )
      .eq('id', nodeId)
      .eq('organization_id', auth.organizationId)
      .single();

    if (nodeError || !node) {
      logger.error('Error fetching node:', nodeError);
      return apiError('NODE_NOT_FOUND', 'Node not found', 404);
    }

    const formattedManager = node.manager
      ? {
          id: node.manager.id,
          email: node.manager.email,
          display_name:
            node.manager.display_name ||
            `${node.manager.first_name} ${node.manager.last_name}`,
          first_name: node.manager.first_name,
          last_name: node.manager.last_name,
          profile_picture_url: node.manager.profile_picture_url,
        }
      : null;

    const adminClient = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    const { data: children, error: childrenError } = await adminClient
      .from('organization_nodes')
      .select(
        `id, name, type, parent_id, properties,
         users_count:organization_node_users(count),
         manager:users!manager_id (id, first_name, last_name, display_name, profile_picture_url)`,
      )
      .eq('parent_id', nodeId)
      .eq('organization_id', auth.organizationId)
      .order('created_at', { ascending: true });

    if (childrenError) {
      logger.error('Error fetching children:', childrenError);
    }

    const formattedChildren =
      children?.map((child) => {
        const manager = Array.isArray(child.manager)
          ? child.manager[0]
          : child.manager;
        return {
          ...child,
          users_count: Array.isArray(child.users_count)
            ? child.users_count[0]?.count || 0
            : 0,
          manager: manager
            ? {
                display_name:
                  manager.display_name ||
                  `${manager.first_name || ''} ${manager.last_name || ''}`.trim(),
                profile_picture_url: manager.profile_picture_url,
              }
            : null,
        };
      }) || [];

    const { data: courses } = await supabase
      .from('organization_node_courses')
      .select(`*, course:courses (id, title, thumbnail_url, category)`)
      .eq('node_id', nodeId);

    const formattedCourses =
      courses?.map((c) => ({
        assignment_id: c.id,
        status: c.status,
        due_date: c.due_date,
        ...c.course,
      })) || [];

    return NextResponse.json({
      success: true,
      data: {
        node: { ...node, manager: formattedManager },
        children: formattedChildren,
        courses: formattedCourses,
      },
    });
  } catch (error) {
    logger.error('Error in GET /nodes/[id]:', error);
    return apiError('INTERNAL_ERROR', 'Internal Server Error', 500);
  }
}

async function handlePut(
  _request: NextRequest,
  body: UpdateNodeBody,
  { params }: RouteContext,
) {
  try {
    const auth = await requireBusiness();
    if (auth instanceof NextResponse) return auth;

    const supabase = await createClient();
    const { nodeId } = await params;

    const { data, error } = await supabase
      .from('organization_nodes')
      .update(body)
      .eq('id', nodeId)
      .eq('organization_id', auth.organizationId)
      .select()
      .single();

    if (error) {
      return apiError('UPDATE_NODE_FAILED', error.message, 500);
    }

    const newManagerId =
      typeof (body as Record<string, unknown>).manager_id === 'string'
        ? ((body as Record<string, unknown>).manager_id as string)
        : null;

    if (newManagerId) {
      await supabase
        .from('organization_node_users')
        .update({ role: 'member' })
        .eq('node_id', nodeId)
        .eq('role', 'leader');

      const { data: existingMember } = await supabase
        .from('organization_node_users')
        .select('id, role')
        .eq('node_id', nodeId)
        .eq('user_id', newManagerId)
        .single();

      if (existingMember) {
        await supabase
          .from('organization_node_users')
          .update({ role: 'leader' })
          .eq('id', existingMember.id);
      } else {
        await supabase.from('organization_node_users').insert({
          node_id: nodeId,
          user_id: newManagerId,
          role: 'leader',
        });
      }
    }

    return NextResponse.json({ data });
  } catch {
    return apiError('INTERNAL_ERROR', 'Internal Server Error', 500);
  }
}

export const PUT = withZodBody(updateNodeSchema, handlePut);

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  try {
    const auth = await requireBusiness();
    if (auth instanceof NextResponse) return auth;

    const supabase = await createClient();
    const { nodeId } = await params;

    const { error } = await supabase
      .from('organization_nodes')
      .delete()
      .eq('id', nodeId)
      .eq('organization_id', auth.organizationId);

    if (error) {
      return apiError('DELETE_NODE_FAILED', error.message, 500);
    }
    return NextResponse.json({ success: true });
  } catch {
    return apiError('INTERNAL_ERROR', 'Internal Server Error', 500);
  }
}
