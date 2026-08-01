import { NextRequest, NextResponse } from 'next/server';
import { requireBusiness } from '@/lib/auth/requireBusiness';
import { createAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/utils/logger';

interface RouteContext {
  params: Promise<{ orgSlug: string }>;
}

interface OrganizationUserRow {
  user_id: string;
}

const MAX_SEARCH_QUERY_LENGTH = 80;

/**
 * GET /api/[orgSlug]/business/hierarchy/users/search
 * Returns active users that belong to the requested organization.
 */
export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const { orgSlug } = await params;
    const auth = await requireBusiness({ organizationSlug: orgSlug });
    if (auth instanceof NextResponse) return auth;

    const query = normalizeSearchQuery(new URL(request.url).searchParams.get('query'));
    const supabase = createAdminClient();

    const { data: organizationUsers, error: organizationUsersError } = await supabase
      .from('organization_users')
      .select('user_id')
      .eq('organization_id', auth.organizationId)
      .eq('status', 'active')
      .returns<OrganizationUserRow[]>();

    if (organizationUsersError) {
      logger.error('Error fetching organization users for manager selector:', organizationUsersError);
      return NextResponse.json({ error: 'Failed to fetch organization users' }, { status: 500 });
    }

    const userIds = (organizationUsers || []).map(({ user_id }) => user_id);
    if (userIds.length === 0) return NextResponse.json({ users: [] });

    let usersQuery = supabase
      .from('users')
      .select('id, first_name, last_name, email, profile_picture_url, username')
      .in('id', userIds)
      .order('first_name', { ascending: true })
      .limit(100);

    if (query) {
      usersQuery = usersQuery.or(
        `first_name.ilike.%${query}%,last_name.ilike.%${query}%,email.ilike.%${query}%,username.ilike.%${query}%`,
      );
    }

    const { data: users, error: usersError } = await usersQuery;
    if (usersError) {
      logger.error('Error fetching user profiles for manager selector:', usersError);
      return NextResponse.json({ error: 'Failed to fetch organization users' }, { status: 500 });
    }

    return NextResponse.json({ users: users || [] });
  } catch (error) {
    logger.error('Error in hierarchy organization user search:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function normalizeSearchQuery(value: string | null): string {
  return (value || '')
    .trim()
    .replace(/[,%*_()]/g, ' ')
    .replace(/\s+/g, ' ')
    .slice(0, MAX_SEARCH_QUERY_LENGTH);
}
