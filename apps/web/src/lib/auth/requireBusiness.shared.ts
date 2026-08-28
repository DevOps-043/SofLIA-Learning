import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import { logger } from '@/lib/logger';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

import { resolveBusinessAccess } from './business-auth/access.service';
import { createBusinessAuthErrorResponse } from './business-auth/response';
import type { BusinessAccessMode } from './business-auth/types';
import type {
  BusinessAccessStrategy,
  BusinessAuth,
  RequireBusinessOptions,
} from './requireBusiness.types';

function getBusinessAccessMode(
  strategy: BusinessAccessStrategy,
): BusinessAccessMode {
  return strategy.logPrefix === 'requireBusinessUser'
    ? 'business-user'
    : 'business-admin';
}

export async function requireBusinessAccess(
  options: RequireBusinessOptions | undefined,
  strategy: BusinessAccessStrategy,
): Promise<BusinessAuth | NextResponse> {
  try {
    const result = await resolveBusinessAccess({
      mode: getBusinessAccessMode(strategy),
      cookieStore: await cookies(),
      supabase: await createClient(),
      securitySupabase: createAdminClient(),
      logger,
      options,
    });

    if (!result.ok) {
      return createBusinessAuthErrorResponse(result.error);
    }

    return result.value;
  } catch (error) {
    logger.error(
      strategy.errorLogMessage,
      error instanceof Error ? error : undefined,
    );

    return createBusinessAuthErrorResponse({
      status: 500,
      message: 'Error interno del servidor.',
    });
  }
}
