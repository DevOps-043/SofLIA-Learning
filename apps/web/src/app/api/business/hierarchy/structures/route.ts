import { createClient } from '@/lib/supabase/server';
import { requireBusiness } from '@/lib/auth/requireBusiness';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const supabase = await createClient();

    // Auth Check
    const auth = await requireBusiness();
    if (auth instanceof NextResponse) return auth;

    const { organizationId } = auth;

    // Additional safety: if organizationId is missing even after auth success
    if (!organizationId) {
        return NextResponse.json({ error: 'Organization context missing' }, { status: 400 });
    }

    const { data: structures, error } = await supabase
        .from('organization_structures')
        .select('*')
        .eq('organization_id', organizationId)
        .order('is_default', { ascending: false })
        .order('name');

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ structures });
}

export async function POST(request: Request) {
    const supabase = await createClient();

    // Auth Check
    const auth = await requireBusiness();
    if (auth instanceof NextResponse) return auth;

    const { organizationId } = auth;

    const { name } = await request.json();

    const { data, error } = await supabase
        .from('organization_structures')
        .insert({ name, organization_id: organizationId })
        .select()
        .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ data });
}
