import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireBusiness } from '@/lib/auth/requireBusiness';
import { logger } from '@/lib/utils/logger';

/**
 * GET /api/business/hierarchy/nodes/[nodeId]/members/available
 * Returns a list of users in the organization who are NOT members of this node.
 */
export async function GET(
    request: Request,
    { params }: { params: { nodeId: string } }
) {
    try {
        const auth = await requireBusiness();
        if (auth instanceof NextResponse) return auth;

        const nodeId = params.nodeId;
        const { searchParams } = new URL(request.url);
        const query = searchParams.get('query') || '';
        const includeCurrentMembers = searchParams.get('includeCurrentMembers') === 'true';

        const supabase = await createClient();

        // 1. Get IDs of current members of THIS NODE to exclude (unless requested otherwise)
        let excludedUserIds: string[] = [];

        if (!includeCurrentMembers) {
            const { data: currentMembers } = await supabase
                .from('organization_node_users')
                .select('user_id')
                .eq('node_id', nodeId);

            excludedUserIds = (currentMembers || []).map(m => m.user_id);
        }

        // 2. Get all active user IDs in the ORGANIZATION
        const { data: orgMembers, error: orgError } = await supabase
            .from('organization_users')
            .select('user_id')
            .eq('organization_id', auth.organizationId)
            .eq('status', 'active');

        if (orgError) {
            logger.error('Error fetching org members:', orgError);
            return NextResponse.json({ success: false, error: 'Failed to fetch organization members' }, { status: 500 });
        }

        const orgUserIds = orgMembers.map(m => m.user_id);

        if (orgUserIds.length === 0) {
            return NextResponse.json({ success: true, users: [] });
        }

        // 3. Fetch User details for these IDs
        let dbQuery = supabase
            .from('users')
            .select('id, first_name, last_name, email, profile_picture_url, username')
            .in('id', orgUserIds);

        // Filter by query (text search) if provided
        if (query) {
            dbQuery = dbQuery.or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,email.ilike.%${query}%,username.ilike.%${query}%`);
        }

        const { data: users, error: usersError } = await dbQuery;

        if (usersError) {
            logger.error('Error fetching user details:', usersError);
            return NextResponse.json({ success: false, error: `Failed to fetch user details: ${usersError.message}` }, { status: 500 });
        }

        // 4. Filter out node members (excluded IDs)
        const availableUsers = users.filter(u => !excludedUserIds.includes(u.id));

        return NextResponse.json({
            success: true,
            users: availableUsers
        });

    } catch (error: unknown) {
        logger.error('Error in GET /api/business/hierarchy/nodes/[nodeId]/members/available:', error);
        return NextResponse.json(
            { success: false, error: `Internal server error: ${error instanceof Error ? error.message : String(error)}` },
            { status: 500 }
        );
    }
}
