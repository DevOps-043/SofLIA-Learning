'use server';

import { redirect } from 'next/navigation';
import { logger } from '../../../lib/logger';
import { createAdminClient } from '../../../lib/supabase/admin';
import { resolveOAuthDashboardDestination } from '../services/oauth-flow';
import { SessionService } from '../services/session.service';

export async function redirectToDashboard() {
  try {
    const user = await SessionService.getCurrentUser();

    if (!user) {
      logger.warn('Dashboard redirect: usuario no autenticado');
      redirect('/auth');
    }

    const destination = await resolveOAuthDashboardDestination(
      createAdminClient(),
      user.id
    );

    redirect(destination);
  } catch (error) {
    if (error && typeof error === 'object' && 'digest' in error) {
      const digest = (error as { digest?: unknown }).digest;

      if (typeof digest === 'string' && digest.startsWith('NEXT_REDIRECT')) {
        throw error;
      }
    }

    logger.error('Error en redirectToDashboard', error);
    redirect('/dashboard');
  }
}
