import { logger as techDebtLogger } from '@/lib/utils/logger'
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireBusiness } from '@/lib/auth/requireBusiness';


/**
 * GET /api/business/hierarchy/nodes/[nodeId]/members
 * Returns a list of members assigned to a specific node.
 */
export async function GET(
    request: Request,
    { params }: { params: Promise<{ nodeId: string }> }
) {
    try {
        const auth = await requireBusiness();
        if (auth instanceof NextResponse) return auth;

        const { nodeId } = await params;

        const supabase = await createClient();

        // Verify node belongs to organization
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
            techDebtLogger.error('Error fetching node members:', membersError);
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
        techDebtLogger.error('Error in GET /api/business/hierarchy/nodes/[nodeId]/members:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/business/hierarchy/nodes/[nodeId]/members
 * Assigns a user to a node.
 */
export async function POST(
    request: Request,
    { params }: { params: Promise<{ nodeId: string }> }
) {
    try {
        const auth = await requireBusiness();
        if (auth instanceof NextResponse) return auth;

        const { nodeId } = await params;
        const supabase = await createClient();

        // 1. Verify Node exists
        const { data: node, error: nodeError } = await supabase
            .from('organization_nodes')
            .select('id, manager_id, parent_id')
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
        const isManager = node.manager_id === auth.userId;

        if (auth.organizationRole !== 'owner' && auth.organizationRole !== 'admin' && !isManager) {
            return NextResponse.json(
                { success: false, error: 'Insufficient permissions' },
                { status: 403 }
            );
        }

        const body = await request.json();
        const { userId, role = 'member', isPrimary = false } = body;

        if (!userId) {
            return NextResponse.json(
                { success: false, error: 'User ID is required' },
                { status: 400 }
            );
        }

        // 2. Verify User exists in Organization
        const { data: orgUser, error: userError } = await supabase
            .from('organization_users')
            .select('id, user_id')
            .eq('user_id', userId)
            .eq('organization_id', auth.organizationId)
            .eq('status', 'active')
            .single();

        if (userError || !orgUser) {
            return NextResponse.json(
                { success: false, error: 'User not found in organization' },
                { status: 404 }
            );
        }

        // 3. Assign User to Node (Upsert/Update if exists)
        // Check if already assigned
        const { data: existingAssignment } = await supabase
            .from('organization_node_users')
            .select('id, role')
            .eq('node_id', nodeId)
            .eq('user_id', userId)
            .single();

        // 3. If Role is Leader, demote existing leaders first
        if (role === 'leader') {
            await supabase
                .from('organization_node_users')
                .update({ role: 'member' })
                .eq('node_id', nodeId)
                .eq('role', 'leader');
        }

        let resultData;

        if (existingAssignment) {
            // Update existing assignment
            if (existingAssignment.role === role) {
                return NextResponse.json(
                    { success: false, error: 'User already assigned with this role' },
                    { status: 409 }
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
            // Create new assignment
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

        // 4. If Role is Leader, update Node Manager
        if (role === 'leader') {
            const { error: updateNodeError } = await supabase
                .from('organization_nodes')
                .update({ manager_id: userId })
                .eq('id', nodeId);

            if (updateNodeError) {
                techDebtLogger.error('Error updating node manager from member assignment:', updateNodeError);
                // We keep the member assignment but log the error
            }
        }

        return NextResponse.json({
            success: true,
            member: resultData
        });

    } catch (error: unknown) {
        techDebtLogger.error('Error in POST /api/business/hierarchy/nodes/[nodeId]/members:', error);
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
