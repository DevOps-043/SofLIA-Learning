import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireBusiness } from '@/lib/auth/requireBusiness';
import { logger } from '@/lib/utils/logger';

interface RouteContext {
  params: Promise<{ orgSlug: string; nodeId: string }>;
}

/**
 * GET /api/[orgSlug]/business/hierarchy/nodes/[nodeId]/members/available
 */
export async function GET(
    request: NextRequest,
    { params }: RouteContext
) {
    try {
        const { orgSlug, nodeId } = await params;
        const auth = await requireBusiness({ organizationSlug: orgSlug });
        if (auth instanceof NextResponse) return auth;

        const { searchParams } = new URL(request.url);
        const query = searchParams.get('query') || '';
        const includeCurrentMembers = searchParams.get('includeCurrentMembers') === 'true';

        const supabase = await createClient();

        let excludedUserIds: string[] = [];

        if (!includeCurrentMembers) {
            const { data: currentMembers } = await supabase
                .from('organization_node_users')
                .select('user_id')
                .eq('node_id', nodeId);

            excludedUserIds = (currentMembers || []).map((m: any) => m.user_id);
        }

        const { data: orgMembers, error: orgError } = await supabase
            .from('organization_users')
            .select('user_id')
            .eq('organization_id', auth.organizationId)
            .eq('status', 'active');

        if (orgError) {
            logger.error('Error fetching org members:', orgError);
            return NextResponse.json({ success: false, error: 'Failed to fetch organization members' }, { status: 500 });
        }

        const orgUserIds = orgMembers.map((m: any) => m.user_id);

        if (orgUserIds.length === 0) {
            return NextResponse.json({ success: true, users: [] });
        }

        let dbQuery = supabase
            .from('users')
            .select('id, first_name, last_name, email, profile_picture_url, username')
            .in('id', orgUserIds);

        if (query) {
            dbQuery = dbQuery.or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,email.ilike.%${query}%,username.ilike.%${query}%`);
        }

        const { data: users, error: usersError } = await dbQuery;

        if (usersError) {
            logger.error('Error fetching user details:', usersError);
            return NextResponse.json({ success: false, error: `Failed to fetch user details: ${usersError.message}` }, { status: 500 });
        }

        const availableUsers = users.filter((u: any) => !excludedUserIds.includes(u.id));

        return NextResponse.json({
            success: true,
            users: availableUsers
        });

    } catch (error: any) {
        logger.error('Error in GET /api/[orgSlug]/business/hierarchy/nodes/[nodeId]/members/available:', error);
        return NextResponse.json(
            { success: false, error: `Internal server error: ${error.message}` },
            { status: 500 }
        );
    }
}
