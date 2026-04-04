import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireBusiness } from '@/lib/auth/requireBusiness';


/**
 * DELETE /api/business/hierarchy/nodes/[nodeId]/members/[userId]
 * Removes a user from a node.
 */
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ nodeId: string; userId: string }> }
) {
    try {
        const auth = await requireBusiness();
        if (auth instanceof NextResponse) return auth;

        const { nodeId, userId } = await params;

        if (!nodeId || !userId) {
            return NextResponse.json(
                { success: false, error: 'Missing nodeId or userId' },
                { status: 400 }
            );
        }

        const supabase = await createClient();

        // Verify Node belongs to Org and check manager
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

        // Check permissions: Owner, Admin, OR Manager of this node
        // We check organization_node_users to be robust against manager_id desync
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

        // Check if user is the manager
        if (node.manager_id === userId) {
            await supabase
                .from('organization_nodes')
                .update({ manager_id: null })
                .eq('id', nodeId);
        }

        // Attempt to delete
        const { error: deleteError } = await supabase
            .from('organization_node_users')
            .delete()
            .eq('node_id', nodeId)
            .eq('user_id', userId);

        if (deleteError) {
            console.error('Error removing user from node:', deleteError);
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
        console.error('Error in DELETE /api/business/hierarchy/nodes/[nodeId]/members/[userId]:', error);
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
