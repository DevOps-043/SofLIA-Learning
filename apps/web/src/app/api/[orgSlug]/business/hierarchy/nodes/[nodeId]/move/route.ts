import { createClient } from '@/lib/supabase/server';
import { requireBusiness } from '@/lib/auth/requireBusiness';
import { NextRequest, NextResponse } from 'next/server';

interface RouteContext {
  params: Promise<{ orgSlug: string; nodeId: string }>;
}

/**
 * POST /api/[orgSlug]/business/hierarchy/nodes/[nodeId]/move
 */
export async function POST(
    request: NextRequest,
    { params }: RouteContext
) {
    try {
        const { orgSlug, nodeId } = await params;
        const auth = await requireBusiness({ organizationSlug: orgSlug });
        if (auth instanceof NextResponse) return auth;

        const supabase = await createClient();
        const { new_parent_id } = await request.json();

        // 1. Fetch current node
        const { data: node } = await supabase
            .from('organization_nodes')
            .select(SELECT_COLUMNS.organization_nodes)
            .eq('id', nodeId)
            .eq('organization_id', auth.organizationId)
            .single();

        if (!node) return NextResponse.json({ error: 'Node not found' }, { status: 404 });

        // 2. Fetch new parent
        let newPath = 'root';
        let newDepth = 0;

        if (new_parent_id) {
            const { data: parent } = await supabase
                .from('organization_nodes')
                .select(SELECT_COLUMNS.organization_nodes)
                .eq('id', new_parent_id)
                .eq('organization_id', auth.organizationId)
                .single();

            if (!parent) return NextResponse.json({ error: 'Parent not found' }, { status: 404 });

            if (parent.path.startsWith(node.path)) {
                return NextResponse.json({ error: 'Cannot move node into its own descendant' }, { status: 400 });
            }

            const slug = node.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
            newPath = `${parent.path}.${slug}`;
            newDepth = parent.depth + 1;
        } else {
            const slug = node.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
            newPath = `root.${slug}`;
            newDepth = 0;
        }

        const { data: descendants } = await supabase
            .from('organization_nodes')
            .select('id, path')
            .like('path', `${node.path}.%`)
            .eq('organization_id', auth.organizationId);

        const { error: updateError } = await supabase
            .from('organization_nodes')
            .update({
                parent_id: new_parent_id,
                path: newPath,
                depth: newDepth
            })
            .eq('id', nodeId);

        if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

        if (descendants && descendants.length > 0) {
            for (const desc of descendants) {
                const newDescPath = desc.path.replace(node.path, newPath);
                const newDescDepth = newDescPath.split('.').length - 1;

                await supabase
                    .from('organization_nodes')
                    .update({ path: newDescPath, depth: newDescDepth })
                    .eq('id', desc.id);
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
