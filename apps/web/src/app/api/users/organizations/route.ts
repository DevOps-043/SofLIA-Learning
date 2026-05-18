import { logger as techDebtLogger } from '@/lib/utils/logger'
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { SessionService } from '@/features/auth/services/session.service';
import { logger } from '@/lib/logger';

/**
 * GET /api/users/organizations
 *
 * Fetches all organizations the current user belongs to.
 * Used by OrganizationProvider to populate the organization switcher.
 */
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const currentUser = await SessionService.getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      );
    }

    const supabase = await createClient();

    // Fetch all organizations the user belongs to with their role
    const { data: memberships, error: membershipError } = await supabase
      .from('organization_users')
      .select(`
        role,
        joined_at,
        organizations!inner (
          id,
          name,
          slug,
          logo_url,
          brand_logo_url,
          brand_color_primary,
          subscription_plan,
          subscription_status,
          is_active
        )
      `)
      .eq('user_id', currentUser.id)
      .eq('status', 'active')
      .eq('organizations.is_active', true)
      .order('joined_at', { ascending: true });

    if (membershipError) {
      techDebtLogger.error('Error fetching organizations:', membershipError);
      return NextResponse.json(
        { success: false, error: 'Error al obtener organizaciones' },
        { status: 500 }
      );
    }

    // Transform the response to a cleaner format
    const organizations = (memberships || []).map((membership) => {
      const org = membership.organizations as unknown as {
        id: string;
        name: string;
        slug: string;
        logo_url: string | null;
        brand_logo_url: string | null;
        brand_color_primary: string | null;
        subscription_plan: string | null;
        subscription_status: string | null;
      };

      return {
        id: org.id,
        name: org.name,
        slug: org.slug,
        logo_url: org.logo_url,
        brand_logo_url: org.brand_logo_url,
        brand_color_primary: org.brand_color_primary,
        role: membership.role,
        subscription_plan: org.subscription_plan,
        subscription_status: org.subscription_status,
      };
    });

    return NextResponse.json({
      success: true,
      organizations,
    });
  } catch (error) {
    logger.error('Error in /api/users/organizations:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
