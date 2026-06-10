import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireBusiness } from '@/lib/auth/requireBusiness';
import { getUserTeamAssignment } from '@/lib/auth/hierarchical-access';
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
  team_id: string | null;
  organizations: OrganizationHierarchyRow;
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
          team_id,
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

    // Team requirement is active: resolve assignment across both hierarchy systems.
    const { hasTeam, teamName } = await getUserTeamAssignment(supabase, userId, orgUser.team_id);

    return NextResponse.json({
        success: true,
        required: true,
        hasTeam,
        teamName
    });
}
