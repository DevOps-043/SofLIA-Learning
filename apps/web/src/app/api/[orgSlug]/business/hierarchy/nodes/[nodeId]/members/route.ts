import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireBusiness } from '@/lib/auth/requireBusiness';
import { apiError } from '@/lib/api/errors';
import { withZodBody } from '@/lib/api/with-validation';
import {
    nodeMemberAssignmentSchema,
    type NodeMemberAssignmentBody,
} from '@/app/api/business/hierarchy/_schemas';

interface RouteContext {
  params: Promise<{ orgSlug: string; nodeId: string }>;
}

/**
 * GET /api/[orgSlug]/business/hierarchy/nodes/[nodeId]/members
 */
export async function GET(
    request: NextRequest,
    { params }: RouteContext
) {
    try {
        const { orgSlug, nodeId } = await params;
        const auth = await requireBusiness({ organizationSlug: orgSlug });
        if (auth instanceof NextResponse) return auth;

        const supabase = await createClient();

        const { data: node, error: nodeError } = await supabase
            .from('organization_nodes')
            .select('id')
            .eq('id', nodeId)
            .eq('organization_id', auth.organizationId)
            .single();

        if (nodeError || !node) {
            return NextResponse.json(
                { success: false, error: 'Node not found or access denied' },
                { status: 404 }
            );
        }

        const { data: members, error: membersError } = await supabase
            .from('organization_node_users')
            .select(`
        id,
        user_id,
        role,
        is_primary,
        created_at,
        users!inner (
          id,
          first_name,
          last_name,
          email,
          profile_picture_url,
          username
        )
      `)
            .eq('node_id', nodeId)
            .order('created_at', { ascending: false });

        if (membersError) {
            return NextResponse.json(
                { success: false, error: 'Failed to fetch members' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            members
        });
    } catch (error) {
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/[orgSlug]/business/hierarchy/nodes/[nodeId]/members
 */
async function handlePost(
    _request: NextRequest,
    body: NodeMemberAssignmentBody,
    { params }: RouteContext
) {
    try {
        const { orgSlug, nodeId } = await params;
        const auth = await requireBusiness({ organizationSlug: orgSlug });
        if (auth instanceof NextResponse) return auth;

        const supabase = await createClient();

        const { data: node, error: nodeError } = await supabase
            .from('organization_nodes')
            .select('id, manager_id, parent_id')
            .eq('id', nodeId)
            .eq('organization_id', auth.organizationId)
            .single();

        if (nodeError || !node) {
            return apiError('NODE_NOT_FOUND', 'Node not found', 404);
        }

        const isManager = node.manager_id === auth.userId;

        if (auth.organizationRole !== 'owner' && auth.organizationRole !== 'admin' && !isManager) {
            return apiError('FORBIDDEN', 'Insufficient permissions', 403);
        }

        const { userId, role = 'member', isPrimary = false } = body;

        const { data: orgUser, error: userError } = await supabase
            .from('organization_users')
            .select('id, user_id')
            .eq('user_id', userId)
            .eq('organization_id', auth.organizationId)
            .eq('status', 'active')
            .single();

        if (userError || !orgUser) {
            return apiError('USER_NOT_IN_ORG', 'User not found in organization', 404);
        }

        const { data: existingAssignment } = await supabase
            .from('organization_node_users')
            .select('id, role')
            .eq('node_id', nodeId)
            .eq('user_id', userId)
            .single();

        if (role === 'leader') {
            await supabase
                .from('organization_node_users')
                .update({ role: 'member' })
                .eq('node_id', nodeId)
                .eq('role', 'leader');
        }

        let resultData;

        if (existingAssignment) {
            if (existingAssignment.role === role) {
                return apiError(
                    'DUPLICATE_ASSIGNMENT',
                    'User already assigned with this role',
                    409,
                );
            }

            const { data, error: updateError } = await supabase
                .from('organization_node_users')
                .update({ role, is_primary: isPrimary })
                .eq('id', existingAssignment.id)
                .select()
                .single();

            if (updateError) throw updateError;
            resultData = data;
        } else {
            const { data, error: insertError } = await supabase
                .from('organization_node_users')
                .insert({
                    node_id: nodeId,
                    user_id: userId,
                    role,
                    is_primary: isPrimary
                })
                .select()
                .single();

            if (insertError) throw insertError;
            resultData = data;
        }

        if (role === 'leader') {
            await supabase
                .from('organization_nodes')
                .update({ manager_id: userId })
                .eq('id', nodeId);
        }

        return NextResponse.json({
            success: true,
            member: resultData
        });

    } catch (error: unknown) {
        return apiError(
            'INTERNAL_ERROR',
            error instanceof Error ? error.message : 'Internal server error',
            500,
        );
    }
}

export const POST = withZodBody(nodeMemberAssignmentSchema, handlePost);
