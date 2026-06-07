import { NextRequest, NextResponse } from 'next/server';
import { requireBusiness } from '@/lib/auth/requireBusiness';
import { logger } from '@/lib/utils/logger';
import { createAdminClient } from '@/lib/supabase/admin';

interface RouteContext {
  params: Promise<{ orgSlug: string; nodeId: string }>;
}

interface OrganizationNodeUserRow {
  user_id: string;
}

interface AvailableUserRow {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  profile_picture_url: string | null;
  username: string | null;
}

const MAX_SEARCH_QUERY_LENGTH = 80;

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
        const query = normalizeSearchQuery(searchParams.get('query'));
        const includeCurrentMembers = searchParams.get('includeCurrentMembers') === 'true';

        const supabase = createAdminClient();

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

        let excludedUserIds: string[] = [];

        if (!includeCurrentMembers) {
            const { data: currentMembers } = await supabase
                .from('organization_node_users')
                .select('user_id')
                .eq('node_id', nodeId)
                .returns<OrganizationNodeUserRow[]>();

            excludedUserIds = (currentMembers || []).map((member) => member.user_id);
        }

        const { data: orgMembers, error: orgError } = await supabase
            .from('organization_users')
            .select('user_id')
            .eq('organization_id', auth.organizationId)
            .eq('status', 'active')
            .returns<OrganizationNodeUserRow[]>();

        if (orgError) {
            logger.error('Error fetching org members:', orgError);
            return NextResponse.json({ success: false, error: 'Failed to fetch organization members' }, { status: 500 });
        }

        const orgUserIds = (orgMembers || []).map((member) => member.user_id);

        if (orgUserIds.length === 0) {
            return NextResponse.json({ success: true, users: [] });
        }

        let dbQuery = supabase
            .from('users')
            .select('id, first_name, last_name, email, profile_picture_url, username')
            .in('id', orgUserIds)
            .returns<AvailableUserRow[]>();

        if (query) {
            dbQuery = dbQuery.or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,email.ilike.%${query}%,username.ilike.%${query}%`);
        }

        const { data: users, error: usersError } = await dbQuery;

        if (usersError) {
            logger.error('Error fetching user details:', usersError);
            return NextResponse.json({ success: false, error: 'Failed to fetch user details' }, { status: 500 });
        }

        const availableUsers = (users || []).filter((user) => !excludedUserIds.includes(user.id));

        return NextResponse.json({
            success: true,
            users: availableUsers
        });

    } catch (error: unknown) {
        logger.error('Error in GET /api/[orgSlug]/business/hierarchy/nodes/[nodeId]/members/available:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}

function normalizeSearchQuery(value: string | null): string {
    return (value || '')
        .trim()
        .replace(/[,%*_()]/g, ' ')
        .replace(/\s+/g, ' ')
        .slice(0, MAX_SEARCH_QUERY_LENGTH);
}
