import { logger as techDebtLogger } from '@/lib/utils/logger'
import { NextResponse } from 'next/server';
import { apiError } from '@/lib/api/errors';
import { createClient } from '../../../../lib/supabase/server';
import { resolveOAuthDashboardDestination } from '../../../../features/auth/services/oauth-flow';
import { SessionService } from '../../../../features/auth/services/session.service';

export const dynamic = 'force-dynamic';

/**
 * GET /api/auth/dashboard-destination
 * 
 * Returns the appropriate dashboard URL for the authenticated user
 * based on their role (admin, instructor, business, etc.).
 * 
 * This API route exists as a client-friendly alternative to the
 * `redirectToDashboard` Server Action, which uses `redirect()` and
 * can fail on Netlify deployments where Server Action redirects
 * are not reliably propagated to the client.
 */
export async function GET() {
  try {
    const user = await SessionService.getCurrentUser();

    if (!user) {
      return apiError('UNAUTHENTICATED', 'No autenticado.', 401, {
        details: { destination: '/auth' },
      });
    }

    const destination = await resolveOAuthDashboardDestination(
      await createClient(),
      user.id,
    );

    return NextResponse.json({ success: true, destination });
  } catch (error) {
    techDebtLogger.error('Error resolving dashboard destination:', error);
    return NextResponse.json(
      { success: true, destination: '/dashboard' },
    );
  }
}
