import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireBusiness } from '@/lib/auth/requireBusiness';

interface RouteContext {
  params: Promise<{ orgSlug: string }>;
}

/**
 * GET /api/[orgSlug]/business/hierarchy/users/search
 * Busca usuarios en la organización
 */
export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const { orgSlug } = await params;
    const auth = await requireBusiness({ organizationSlug: orgSlug });
    if (auth instanceof NextResponse) return auth;

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query') || '';

    const supabase = await createClient();

    let dbQuery = supabase
      .from('organization_users')
      .select(`
        id,
        user_id,
        role,
        job_title,
        status,
        users!inner (
          id,
          first_name,
          last_name,
          email,
          profile_picture_url,
          username
        )
      `)
      .eq('organization_id', auth.organizationId);

    if (query) {
      const q = `%${query}%`;
      dbQuery = dbQuery.or(`first_name.ilike.${q},last_name.ilike.${q},email.ilike.${q}`, { foreignTable: 'users' });
    }

    const { data: users, error } = await dbQuery.limit(20);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Flatten logic
    const formattedUsers = users?.map((u: any) => ({
      ...u,
      ...u.users
    })) || [];

    return NextResponse.json({ users: formattedUsers });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
