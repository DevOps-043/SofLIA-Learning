import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireBusiness } from '@/lib/auth/requireBusiness';
import { logger } from '@/lib/utils/logger';

interface RouteContext {
  params: Promise<{ orgSlug: string }>;
}

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

interface OrganizationHierarchyRow {
  id: string;
  slug: string;
  hierarchy_enabled: boolean | null;
  hierarchy_config: Record<string, unknown> | null;
}

interface OrganizationUserCheckRow {
  organization_id: string;
  role: string;
  organizations: OrganizationHierarchyRow;
}

interface NodeReferenceRow {
  id: string;
  name: string;
  type: string;
}

interface NodeAssignmentRow {
  id: string;
  node_id: string;
  organization_nodes: NodeReferenceRow;
}

/**
 * GET /api/[orgSlug]/business/hierarchy/check-team
 * Checks if the current user needs a team assignment based on org config.
 * Returns: { required: boolean, hasTeam: boolean, teamName?: string }
 */
export async function GET(request: NextRequest, { params }: RouteContext) {
    try {
        const { orgSlug } = await params;
        const auth = await requireBusiness({ organizationSlug: orgSlug });
        if (auth instanceof NextResponse) return auth;

        const supabase = await createClient();

        return checkTeamForUser(supabase, auth.userId, orgSlug);
    } catch (error) {
        logger.error('Error in GET /api/[orgSlug]/business/hierarchy/check-team:', error);
        return NextResponse.json(
            { success: false, error: 'Error interno' },
            { status: 500 }
        );
    }
}

async function checkTeamForUser(supabase: SupabaseServerClient, userId: string, orgSlug: string) {
    // Find user's organization entry
    const { data: orgUser } = await supabase
        .from('organization_users')
        .select(`
          organization_id, 
          role,
          organizations!inner (
            id,
            slug,
            hierarchy_enabled,
            hierarchy_config
          )
        `)
        .eq('user_id', userId)
        .eq('organizations.slug', orgSlug)
        .eq('status', 'active')
        .single<OrganizationUserCheckRow>();

    if (!orgUser) {
        return NextResponse.json({
            success: true,
            required: false,
            hasTeam: false
        });
    }

    // Owners and admins are exempt from team requirement
    if (orgUser.role === 'owner' || orgUser.role === 'admin') {
        return NextResponse.json({
            success: true,
            required: false,
            hasTeam: true
        });
    }

    const org = orgUser.organizations;
    const config = org?.hierarchy_config as Record<string, unknown> | null;
    const requireTeam = org?.hierarchy_enabled && config?.require_team_assignment === true;

    if (!requireTeam) {
        return NextResponse.json({
            success: true,
            required: false,
            hasTeam: true
        });
    }

    // Check if user has a team assignment in organization_node_users
    const { data: nodeAssignment } = await supabase
        .from('organization_node_users')
        .select(`
          id,
          node_id,
          organization_nodes!inner (
            id,
            name,
            type
          )
        `)
        .eq('user_id', userId)
        .limit(1)
        .maybeSingle<NodeAssignmentRow>();

    const hasTeam = !!nodeAssignment;
    const teamName = hasTeam
        ? nodeAssignment.organization_nodes?.name || undefined
        : undefined;

    return NextResponse.json({
        success: true,
        required: true,
        hasTeam,
        teamName
    });
}
