/**
 * API Endpoint: Organization Planner Config
 *
 * GET /api/study-planner/org-config
 *
 * Returns the B2B planner configuration for the authenticated user's
 * organization, including work schedule, holidays, and default planning
 * window settings.
 *
 * Only returns data if the user belongs to an organization.
 */

import { NextRequest, NextResponse } from 'next/server';
import { SessionService } from '../../../../features/auth/services/session.service';
import { UserContextService } from '../../../../features/study-planner/services/user-context.service';
import { OrganizationPlannerConfigService } from '../../../../features/study-planner/services/organization-planner-config.service';
import { logger } from '@/lib/logger';

interface OrgConfigResponse {
  success: boolean;
  data?: {
    config: Awaited<ReturnType<typeof OrganizationPlannerConfigService.getOrganizationPlannerConfig>>;
    holidays: Awaited<ReturnType<typeof OrganizationPlannerConfigService.getOrganizationHolidays>>;
  };
  error?: string;
}

export async function GET(
  _request: NextRequest,
): Promise<NextResponse<OrgConfigResponse>> {
  try {
    const user = await SessionService.getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 },
      );
    }

    const organization = await UserContextService.getUserOrganization(user.id);

    if (!organization?.id) {
      return NextResponse.json({
        success: true,
        data: undefined,
      });
    }

    const today = new Date();
    const sixMonthsLater = new Date();
    sixMonthsLater.setMonth(today.getMonth() + 6);

    const [config, holidays] = await Promise.all([
      OrganizationPlannerConfigService.getOrganizationPlannerConfig(organization.id),
      OrganizationPlannerConfigService.getOrganizationHolidays(
        organization.id,
        today,
        sixMonthsLater,
      ),
    ]);

    return NextResponse.json({
      success: true,
      data: { config, holidays },
    });
  } catch (error) {
    logger.error('[org-config] Error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error interno del servidor',
      },
      { status: 500 },
    );
  }
}
