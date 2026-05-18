import { logger as techDebtLogger } from '@/lib/utils/logger'
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireBusiness } from '@/lib/auth/requireBusiness';

export async function GET(request: Request) {
    try {
        const auth = await requireBusiness();
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
        // .eq('status', 'active'); // Temporarily removed for debugging 

        if (query) {
            // simplified text search on the joined table fields
            // using individual filters to be safe, though OR is better. 
            // Let's try the syntax that definitively works for Supabase JS client with foreign tables.
            // It requires the alias 'users' to be effectively used.
            const q = `%${query}%`;
            dbQuery = dbQuery.or(`first_name.ilike.${q},last_name.ilike.${q},email.ilike.${q}`, { foreignTable: 'users' });
        }


        const { data: users, error } = await dbQuery.limit(20);

        if (error) {
            techDebtLogger.error('[DEBUG] Error fetching users:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }


        // Flatten the structure for easier frontend consumption
        const formattedUsers = users?.map(u => ({
            ...u,
            ...u.users // Merge user basic info at top level for convenience
        })) || [];

        return NextResponse.json({ users: formattedUsers });

    } catch (error) {
        techDebtLogger.error('Error in user search:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
