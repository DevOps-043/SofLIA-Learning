import { createClient } from '@/lib/supabase/server';

import { createClient as createServiceClient } from '@supabase/supabase-js';

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
    properties?: Record<string, unknown> | null;
    metadata?: Record<string, unknown> | null;
}

interface OrganizationNodeInsert {
    structure_id: string;
    parent_id: string | null;
    name: string;
    type: string;
    position?: number | null;
    manager_id?: string | null;
    properties?: Record<string, unknown> | null;
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
