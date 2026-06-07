import { requireBusiness } from '@/lib/auth/requireBusiness';
import { NextRequest, NextResponse } from 'next/server';
import { apiError } from '@/lib/api/errors';
import { withZodBody } from '@/lib/api/with-validation';
import { createAdminClient } from '@/lib/supabase/admin';
import {
    updateNodeSchema,
    type UpdateNodeBody,
} from '@/app/api/business/hierarchy/_schemas';

interface RouteContext {
  params: Promise<{ orgSlug: string; nodeId: string }>;
}

interface NodeChildManager {
  display_name: string | null;
  first_name: string | null;
  last_name: string | null;
  profile_picture_url: string | null;
}

interface NodeChildRow extends Record<string, unknown> {
  users_count: Array<{ count: number | null }> | null;
  manager: NodeChildManager | NodeChildManager[] | null;
}

interface NodeCourseAssignmentRow {
  id: string;
  status: string | null;
  due_date: string | null;
  course: Record<string, unknown> | null;
}

/**
 * GET /api/[orgSlug]/business/hierarchy/nodes/[nodeId]
 * Obtiene un nodo por ID
 */
export async function GET(
    request: NextRequest,
    { params }: RouteContext
) {
    try {
        const { orgSlug, nodeId } = await params;
        const auth = await requireBusiness({ organizationSlug: orgSlug });
        if (auth instanceof NextResponse) return auth;

        const supabase = createAdminClient();

        if (!nodeId) {
            return apiError('NODE_ID_REQUIRED', 'Node ID is required', 400);
        }

        const { data: node, error: nodeError } = await supabase
            .from('organization_nodes')
            .select(`
        *,
        manager:users!manager_id (
          id,
          email,
          first_name,
          last_name,
          profile_picture_url,
          display_name
        )
      `)
            .eq('id', nodeId)
            .eq('organization_id', auth.organizationId)
            .single();

        if (nodeError || !node) {
            return apiError('NODE_NOT_FOUND', 'Node not found', 404);
        }

        const formattedManager = node.manager ? {
            id: node.manager.id,
            email: node.manager.email,
            display_name: node.manager.display_name || `${node.manager.first_name} ${node.manager.last_name}`,
            first_name: node.manager.first_name,
            last_name: node.manager.last_name,
            profile_picture_url: node.manager.profile_picture_url,
        } : null;

        const { data: children, error: childrenError } = await supabase
            .from('organization_nodes')
            .select(`
        id,
        name,
        type,
        parent_id,
        properties,
        users_count:organization_node_users(count),
        manager:users!manager_id (
          id,
          first_name,
          last_name,
          display_name,
          profile_picture_url
        )
      `)
            .eq('parent_id', nodeId)
            .eq('organization_id', auth.organizationId)
            .order('created_at', { ascending: true });

        if (childrenError) {
            return apiError('FETCH_NODE_CHILDREN_FAILED', 'Failed to fetch node children', 500);
        }

        const formattedChildren = children?.map((child: NodeChildRow) => {
            const manager = Array.isArray(child.manager) ? child.manager[0] : child.manager;
            return {
                ...child,
                users_count: Array.isArray(child.users_count) ? child.users_count[0]?.count || 0 : 0,
                manager: manager ? {
                    display_name: manager.display_name || `${manager.first_name || ''} ${manager.last_name || ''}`.trim(),
                    profile_picture_url: manager.profile_picture_url
                } : null
            };
        }) || [];

        const { data: courses } = await supabase
            .from('organization_node_courses')
            .select(`
        *,
        course:courses (
          id,
          title,
          thumbnail_url,
          category
        )
      `)
            .eq('node_id', nodeId);

        const formattedCourses = courses?.map((c: NodeCourseAssignmentRow) => ({
            assignment_id: c.id,
            status: c.status,
            due_date: c.due_date,
            ...(c.course ?? {})
        })) || [];

        return NextResponse.json({
            success: true,
            data: {
                node: {
                    ...node,
                    manager: formattedManager
                },
                children: formattedChildren,
                courses: formattedCourses
            }
        });

    } catch (error) {
        return apiError('INTERNAL_ERROR', 'Internal Server Error', 500);
    }
}

async function handlePut(
    _request: NextRequest,
    body: UpdateNodeBody,
    { params }: RouteContext
) {
    try {
        const { orgSlug, nodeId } = await params;
        const auth = await requireBusiness({ organizationSlug: orgSlug });
        if (auth instanceof NextResponse) return auth;

        if (!auth.organizationId) {
            return apiError('NO_ORGANIZATION', 'Organization ID required', 403);
        }

        const supabase = createAdminClient();

        const { data, error } = await supabase
            .from('organization_nodes')
            .update(body)
            .eq('id', nodeId)
            .eq('organization_id', auth.organizationId)
            .select()
            .single();

        if (error) return apiError('UPDATE_NODE_FAILED', error.message, 500);

        if (body.manager_id && body.manager_id !== null) {
            await supabase
                .from('organization_node_users')
                .update({ role: 'member' })
                .eq('node_id', nodeId)
                .eq('role', 'leader');

            const { data: existingMember } = await supabase
                .from('organization_node_users')
                .select('id, role')
                .eq('node_id', nodeId)
                .eq('user_id', body.manager_id)
                .single();

            if (existingMember) {
                await supabase
                    .from('organization_node_users')
                    .update({ role: 'leader' })
                    .eq('id', existingMember.id);
            } else {
                await supabase
                    .from('organization_node_users')
                    .insert({
                        node_id: nodeId,
                        user_id: body.manager_id,
                        role: 'leader'
                    });
            }
        }
        return NextResponse.json({ data });
    } catch (error) {
        return apiError('INTERNAL_ERROR', 'Internal Server Error', 500);
    }
}

export const PUT = withZodBody(updateNodeSchema, handlePut);

export async function DELETE(
    request: NextRequest,
    { params }: RouteContext
) {
    try {
        const { orgSlug, nodeId } = await params;
        const auth = await requireBusiness({ organizationSlug: orgSlug });
        if (auth instanceof NextResponse) return auth;

        const supabase = createAdminClient();

        const { error } = await supabase
            .from('organization_nodes')
            .delete()
            .eq('id', nodeId)
            .eq('organization_id', auth.organizationId);

        if (error) return apiError('DELETE_NODE_FAILED', error.message, 500);
        return NextResponse.json({ success: true });
    } catch (error) {
        return apiError('INTERNAL_ERROR', 'Internal Server Error', 500);
    }
}
