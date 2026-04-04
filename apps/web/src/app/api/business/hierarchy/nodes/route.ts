import { createClient } from '@/lib/supabase/server';
import { requireBusiness } from '@/lib/auth/requireBusiness';
import { NextResponse } from 'next/server';
import type { BusinessAuth } from '@/lib/auth/requireBusiness';

interface OrganizationNodeManager {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    profile_picture_url: string | null;
}

interface OrganizationNodeRow {
    id: string;
    structure_id: string;
    organization_id: string;
    parent_id: string | null;
    name: string;
    type: string;
    path: string;
    depth: number;
    position: number | null;
    is_active?: boolean | null;
    manager: OrganizationNodeManager | null;
}

interface StructureOrganizationRow {
    organization_id: string;
}

interface ParentNodeRow {
    path: string;
    depth: number;
}

interface CreateNodeRequest {
    structure_id: string;
    parent_id?: string | null;
    name: string;
    type: string;
    position?: number | null;
    manager_id?: string | null;
    metadata?: Record<string, unknown> | null;
}

interface OrganizationNodeInsert {
    structure_id: string;
    parent_id: string | null;
    name: string;
    type: string;
    position?: number | null;
    manager_id?: string | null;
    metadata?: Record<string, unknown> | null;
    organization_id: string;
    path: string;
    depth: number;
}

export async function GET(request: Request) {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const structureId = searchParams.get('structureId');

    if (!structureId) {
        return NextResponse.json({ error: 'Structure ID required' }, { status: 400 });
    }

    const { data: nodes, error } = await supabase
        .from('organization_nodes')
        .select(`
        *,
        manager:manager_id (
            id, first_name, last_name, email, profile_picture_url
        )
    `)
        .eq('structure_id', structureId)
        .order('depth')
        .order('position');

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Check if we assume the client wants flat list or tree. 
    // Let's return flat list to let client build tree or build it here?
    // Let's return flat nodes, easier for client storage/manipulation sometimes, 
    // but if we want simple, let's return flat. The frontend service seemed to expect "nodes" array.
    return NextResponse.json({ nodes: (nodes || []) as OrganizationNodeRow[] });
}

export async function POST(request: Request) {
    const supabase = await createClient();

    // Auth Check
    const auth = await requireBusiness();
    if (auth instanceof NextResponse) return auth;

    const { organizationId } = auth as BusinessAuth;

    if (!organizationId) {
        return NextResponse.json({ error: 'Organization ID required' }, { status: 403 });
    }

    const body: CreateNodeRequest = await request.json();

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
        metadata: body.metadata ?? null,
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
