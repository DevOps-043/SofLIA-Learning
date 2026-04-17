import { NextResponse } from 'next/server';
import { createClient } from '../../../../lib/supabase/server';
import { resolveOAuthDashboardDestination } from '../../../../features/auth/services/oauth-flow';
import { SessionService } from '../../../../features/auth/services/session.service';

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
      return NextResponse.json(
        { success: false, destination: '/auth' },
        { status: 401 },
      );
    }

    const destination = await resolveOAuthDashboardDestination(
      await createClient(),
      user.id,
    );

    return NextResponse.json({ success: true, destination });
  } catch (error) {
    console.error('Error resolving dashboard destination:', error);
    return NextResponse.json(
      { success: true, destination: '/dashboard' },
    );
  }
}
