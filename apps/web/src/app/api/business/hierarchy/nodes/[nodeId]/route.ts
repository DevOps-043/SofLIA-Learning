import { logger as techDebtLogger } from '@/lib/utils/logger'
import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { requireBusiness } from '@/lib/auth/requireBusiness';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
    request: NextRequest,
    { params }: { params: { nodeId: string } }
) {
    try {
        const auth = await requireBusiness();
        if (auth instanceof NextResponse) return auth;

        const supabase = await createClient();
        const nodeId = params.nodeId;

        if (!nodeId) {
            return NextResponse.json({ error: 'Node ID is required' }, { status: 400 });
        }

        // ... existing node fetch ...
        const { data: node, error: nodeError } = await supabase
            .from('organization_nodes')
            .select(SELECT_COLUMNS.organization_nodes) // Simplified for brevity in context match if needed, but keeping original structure best
            // (Assuming keeping lines 21-36 same)
            .select(`
        *,
        manager:users!manager_id (
          id,
          email,
          first_name,
          last_name,
          profile_picture_url,
          display_name
        )
      `)
            .eq('id', nodeId)
            .eq('organization_id', auth.organizationId)
            .single();

        if (nodeError || !node) {
            techDebtLogger.error('Error fetching node:', nodeError);
            return NextResponse.json({ error: 'Node not found' }, { status: 404 });
        }

        // ... manager formatting ...
        const formattedManager = node.manager ? {
            id: node.manager.id,
            email: node.manager.email,
            display_name: node.manager.display_name || `${node.manager.first_name} ${node.manager.last_name}`,
            first_name: node.manager.first_name,
            last_name: node.manager.last_name,
            profile_picture_url: node.manager.profile_picture_url,
        } : null;

        // 2. Get Children Nodes (Using Service Client to ensure visibility regardless of complex RLS)
        // We rely on requireBusiness() + .eq('organization_id') for security
        const adminClient = createServiceClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const { data: children, error: childrenError } = await adminClient
            .from('organization_nodes')
            .select(`
        id,
        name,
        type,
        parent_id,
        properties,
        properties,
        users_count:organization_node_users(count),
        manager:users!manager_id (
          id,
          first_name,
          last_name,
          display_name,
          profile_picture_url
        )
      `)
            .eq('parent_id', nodeId)
            .eq('organization_id', auth.organizationId)
            .order('created_at', { ascending: true });

        if (childrenError) {
            techDebtLogger.error('Error fetching children:', childrenError);
        }

        const formattedChildren = children?.map(child => {
            const manager = Array.isArray(child.manager) ? child.manager[0] : child.manager;
            return {
                ...child,
                users_count: Array.isArray(child.users_count) ? child.users_count[0]?.count || 0 : 0,
                manager: manager ? {
                    display_name: manager.display_name || `${manager.first_name || ''} ${manager.last_name || ''}`.trim(),
                    profile_picture_url: manager.profile_picture_url
                } : null
            };
        }) || [];

        // 3. Get Assigned Courses (Directly assigned)
        const { data: courses, error: coursesError } = await supabase
            .from('organization_node_courses')
            .select(`
        *,
        course:courses (
          id,
          title,
          thumbnail_url,
          category
        )
      `)
            .eq('node_id', nodeId);

        const formattedCourses = courses?.map(c => ({
            assignment_id: c.id,
            status: c.status,
            due_date: c.due_date,
            ...c.course
        })) || [];

        return NextResponse.json({
            success: true,
            data: {
                node: {
                    ...node,
                    manager: formattedManager
                },
                children: formattedChildren,
                courses: formattedCourses
            }
        });

    } catch (error) {
        techDebtLogger.error('Error in GET /nodes/[id]:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: { nodeId: string } }
) {
    try {
        const auth = await requireBusiness();
        if (auth instanceof NextResponse) return auth;

        const supabase = await createClient();
        const body = await request.json();
        const nodeId = params.nodeId;

        const { data, error } = await supabase
            .from('organization_nodes')
            .update(body)
            .eq('id', nodeId)
            .eq('organization_id', auth.organizationId) // Security check
            .select()
            .single();

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });

        // Sync: If manager_id changed, ensure they are a leader member
        if (body.manager_id && body.manager_id !== null) {
            // First, downgrade ALL existing leaders to members
            await supabase
                .from('organization_node_users')
                .update({ role: 'member' })
                .eq('node_id', nodeId)
                .eq('role', 'leader');

            // Check if user is already a member
            const { data: existingMember } = await supabase
                .from('organization_node_users')
                .select('id, role')
                .eq('node_id', nodeId)
                .eq('user_id', body.manager_id)
                .single();

            if (existingMember) {
                await supabase
                    .from('organization_node_users')
                    .update({ role: 'leader' })
                    .eq('id', existingMember.id);
            } else {
                await supabase
                    .from('organization_node_users')
                    .insert({
                        node_id: nodeId,
                        user_id: body.manager_id,
                        role: 'leader'
                    });
            }
        }
        return NextResponse.json({ data });
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: { nodeId: string } }
) {
    try {
        const auth = await requireBusiness();
        if (auth instanceof NextResponse) return auth;

        const supabase = await createClient();
        const nodeId = params.nodeId;

        const { error } = await supabase
            .from('organization_nodes')
            .delete()
            .eq('id', nodeId)
            .eq('organization_id', auth.organizationId); // Security check

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
