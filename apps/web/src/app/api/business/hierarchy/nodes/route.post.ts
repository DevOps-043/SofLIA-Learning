import { createClient as createServiceClient } from '@supabase/supabase-js';

import { requireBusiness } from '@/lib/auth/requireBusiness';

import { NextResponse } from 'next/server';

import type { BusinessAuth } from '@/lib/auth/requireBusiness';
import type {
    CreateNodeRequest,
    OrganizationNodeInsert,
    ParentNodeRow,
    StructureOrganizationRow,
} from './route.post.types';

export async function POST(request: Request) {
    // Auth Check
    const auth = await requireBusiness();
    if (auth instanceof NextResponse) return auth;

    const { organizationId } = auth as BusinessAuth;

    if (!organizationId) {
        return NextResponse.json({ error: 'Organization ID required' }, { status: 403 });
    }

    const body: CreateNodeRequest = await request.json();
    const supabase = createServiceClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    if (!body.structure_id || !body.name || !body.type) {
        return NextResponse.json({ error: 'structure_id, name y type son requeridos' }, { status: 400 });
    }

    // Logic to calculate path and depth
    let path = '';
    let depth = 0;

    // 1. Get Organization ID from structure and VERIFY it matches auth context
    const { data: structure } = await supabase
        .from('organization_structures')
        .select('organization_id')
        .eq('id', body.structure_id)
        .single<StructureOrganizationRow>();

    if (!structure) return NextResponse.json({ error: 'Structure not found' }, { status: 404 });

    // Security check: Ensure structure belongs to the user's organization
    if (structure.organization_id !== organizationId) {
        return NextResponse.json({ error: 'Unauthorized access to this structure' }, { status: 403 });
    }

    // 2. Calculate Path
    if (body.parent_id) {
        const { data: parent } = await supabase
            .from('organization_nodes')
            .select('path, depth')
            .eq('id', body.parent_id)
            .single<ParentNodeRow>();
        if (!parent) return NextResponse.json({ error: 'Parent not found' }, { status: 404 });

        // Sanitize slug
        const slug = body.name.toLowerCase()
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // remove accents
            .replace(/\s+/g, '_')
            .replace(/[^a-z0-9_]/g, '');

        path = `${parent.path}.${slug}`;
        depth = parent.depth + 1;
    } else {
        path = 'root';
        depth = 0;
    }

    const insertData: OrganizationNodeInsert = {
        structure_id: body.structure_id,
        parent_id: body.parent_id || null,
        name: body.name,
        type: body.type,
        position: body.position ?? null,
        manager_id: body.manager_id ?? null,
        properties: body.properties ?? body.metadata ?? {},
        organization_id: organizationId,
        path,
        depth
    };

    const { data, error } = await supabase
        .from('organization_nodes')
        .insert(insertData)
        .select()
        .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data });
}
