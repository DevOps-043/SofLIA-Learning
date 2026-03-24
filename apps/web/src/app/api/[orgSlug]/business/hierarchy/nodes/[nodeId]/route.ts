import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { requireBusiness } from '@/lib/auth/requireBusiness';
import { NextRequest, NextResponse } from 'next/server';

interface RouteContext {
  params: Promise<{ orgSlug: string; nodeId: string }>;
}

/**
 * GET /api/[orgSlug]/business/hierarchy/nodes/[nodeId]
 * Obtiene un nodo por ID
 */
export async function GET(
    request: NextRequest,
    { params }: RouteContext
) {
    try {
        const { orgSlug, nodeId } = await params;
        const auth = await requireBusiness({ organizationSlug: orgSlug });
        if (auth instanceof NextResponse) return auth;

        const supabase = await createClient();

        if (!nodeId) {
            return NextResponse.json({ error: 'Node ID is required' }, { status: 400 });
        }

        const { data: node, error: nodeError } = await supabase
            .from('organization_nodes')
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
            return NextResponse.json({ error: 'Node not found' }, { status: 404 });
        }

        const formattedManager = node.manager ? {
            id: node.manager.id,
            email: node.manager.email,
            display_name: node.manager.display_name || `${node.manager.first_name} ${node.manager.last_name}`,
            first_name: node.manager.first_name,
            last_name: node.manager.last_name,
            profile_picture_url: node.manager.profile_picture_url,
        } : null;

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

        const formattedChildren = children?.map((child: any) => {
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

        const { data: courses } = await supabase
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

        const formattedCourses = courses?.map((c: any) => ({
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
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}

export async function PUT(
    request: NextRequest,
    { params }: RouteContext
) {
    try {
        const { orgSlug, nodeId } = await params;
        const auth = await requireBusiness({ organizationSlug: orgSlug });
        if (auth instanceof NextResponse) return auth;

        const supabase = await createClient();
        const body = await request.json();

        const { data, error } = await supabase
            .from('organization_nodes')
            .update(body)
            .eq('id', nodeId)
            .eq('organization_id', auth.organizationId)
            .select()
            .single();

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });

        if (body.manager_id && body.manager_id !== null) {
            await supabase
                .from('organization_node_users')
                .update({ role: 'member' })
                .eq('node_id', nodeId)
                .eq('role', 'leader');

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
    { params }: RouteContext
) {
    try {
        const { orgSlug, nodeId } = await params;
        const auth = await requireBusiness({ organizationSlug: orgSlug });
        if (auth instanceof NextResponse) return auth;

        const supabase = await createClient();

        const { error } = await supabase
            .from('organization_nodes')
            .delete()
            .eq('id', nodeId)
            .eq('organization_id', auth.organizationId);

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
