import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireBusiness } from '@/lib/auth/requireBusiness';

interface RouteContext {
  params: Promise<{ orgSlug: string; nodeId: string; userId: string }>;
}

/**
 * DELETE /api/[orgSlug]/business/hierarchy/nodes/[nodeId]/members/[userId]
 */
export async function DELETE(
    request: NextRequest,
    { params }: RouteContext
) {
    try {
        const { orgSlug, nodeId, userId } = await params;
        const auth = await requireBusiness({ organizationSlug: orgSlug });
        if (auth instanceof NextResponse) return auth;

        if (!nodeId || !userId) {
            return NextResponse.json(
                { success: false, error: 'Missing nodeId or userId' },
                { status: 400 }
            );
        }

        const supabase = await createClient();

        const { data: node, error: nodeError } = await supabase
            .from('organization_nodes')
            .select('id, manager_id')
            .eq('id', nodeId)
            .eq('organization_id', auth.organizationId)
            .single();

        if (nodeError || !node) {
            return NextResponse.json(
                { success: false, error: 'Node not found' },
                { status: 404 }
            );
        }

        const { data: actorMember } = await supabase
            .from('organization_node_users')
            .select('role')
            .eq('node_id', nodeId)
            .eq('user_id', auth.userId)
            .single();

        const isNodeLeader = actorMember?.role === 'leader';
        const isManager = node.manager_id === auth.userId;

        if (auth.organizationRole !== 'owner' && auth.organizationRole !== 'admin' && !isManager && !isNodeLeader) {
            return NextResponse.json(
                { success: false, error: 'Insufficient permissions' },
                { status: 403 }
            );
        }

        if (node.manager_id === userId) {
            await supabase
                .from('organization_nodes')
                .update({ manager_id: null })
                .eq('id', nodeId);
        }

        const { error: deleteError } = await supabase
            .from('organization_node_users')
            .delete()
            .eq('node_id', nodeId)
            .eq('user_id', userId);

        if (deleteError) {
            return NextResponse.json(
                { success: false, error: 'Failed to remove user' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'User removed successfully'
        });

    } catch (error: unknown) {
        return NextResponse.json(
            {
                success: false,
                error: 'Internal server error',
                details: error instanceof Error ? error.message : String(error)
            },
            { status: 500 }
        );
    }
}
