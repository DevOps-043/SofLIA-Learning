import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

/**
 * GET /api/business/hierarchy/check-team
 * Checks if the current user needs a team assignment based on org config.
 * Returns: { required: boolean, hasTeam: boolean, teamName?: string }
 */
export async function GET() {
    try {
        const supabase = await createClient();

        // Get current user session
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (!authUser) {
            return NextResponse.json(
                { success: false, error: 'No autenticado' },
                { status: 401 }
            );
        }

        // Get user from our users table
        const { data: user } = await supabase
            .from('users')
            .select('id')
            .eq('auth_uid', authUser.id)
            .single();

        if (!user) {
            // Try by email as fallback
            const { data: userByEmail } = await supabase
                .from('users')
                .select('id')
                .eq('email', authUser.email)
                .single();

            if (!userByEmail) {
                return NextResponse.json(
                    { success: false, error: 'Usuario no encontrado' },
                    { status: 404 }
                );
            }

            return checkTeamForUser(supabase, userByEmail.id);
        }

        return checkTeamForUser(supabase, user.id);
    } catch (error) {
        logger.error('Error in GET /api/business/hierarchy/check-team:', error);
        return NextResponse.json(
            { success: false, error: 'Error interno' },
            { status: 500 }
        );
    }
}

async function checkTeamForUser(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
    // Find user's organization
    const { data: orgUser } = await supabase
        .from('organization_users')
        .select('organization_id, role')
        .eq('user_id', userId)
        .eq('status', 'active')
        .single();

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

    // Check org config
    const { data: org } = await supabase
        .from('organizations')
        .select('hierarchy_enabled, hierarchy_config')
        .eq('id', orgUser.organization_id)
        .single();

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
        .maybeSingle();

    const hasTeam = !!nodeAssignment;
    const teamName = hasTeam
        ? (nodeAssignment.organization_nodes as any)?.name || undefined
        : undefined;

    return NextResponse.json({
        success: true,
        required: true,
        hasTeam,
        teamName
    });
}
