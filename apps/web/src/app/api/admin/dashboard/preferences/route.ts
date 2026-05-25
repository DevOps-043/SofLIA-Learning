import { NextRequest, NextResponse } from 'next/server';

import { AdminDashboardPreferencesService } from '@/features/admin/services/adminDashboardPreferences.service';
import { apiError } from '@/lib/api/errors';
import { withZodBody } from '@/lib/api/with-validation';
import { requireAdmin } from '@/lib/auth/requireAdmin';
import { logger } from '@/lib/utils/logger';

import {
  adminDashboardPreferencesSchema,
  type AdminDashboardPreferencesBody,
} from './schema';

/**
 * GET /api/admin/dashboard/preferences
 * Obtener preferencias del admin
 */
export async function GET(_request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (auth instanceof NextResponse) return auth;

    const preferences = await AdminDashboardPreferencesService.getPreferences(auth.userId);

    return NextResponse.json({ success: true, preferences });
  } catch (error) {
    logger.error('Error in dashboard preferences GET:', error);
    return apiError(
      'ADMIN_DASHBOARD_PREFERENCES_FETCH_FAILED',
      'Error al obtener preferencias del dashboard.',
      500,
    );
  }
}

/**
 * POST /api/admin/dashboard/preferences
 * Guardar/actualizar preferencias del admin
 */
async function handlePost(_request: NextRequest, body: AdminDashboardPreferencesBody) {
  try {
    const auth = await requireAdmin();
    if (auth instanceof NextResponse) return auth;

    const preferencesInput: Parameters<typeof AdminDashboardPreferencesService.savePreferences>[1] = {};
    if (body.activity_period !== undefined) {
      preferencesInput.activity_period = body.activity_period;
    }
    if (body.growth_chart_metrics !== undefined) {
      preferencesInput.growth_chart_metrics = body.growth_chart_metrics;
    }

    const preferences = await AdminDashboardPreferencesService.savePreferences(auth.userId, preferencesInput);

    return NextResponse.json({ success: true, preferences });
  } catch (error) {
    logger.error('Error in dashboard preferences POST:', error);
    return apiError(
      'ADMIN_DASHBOARD_PREFERENCES_SAVE_FAILED',
      'Error al guardar preferencias del dashboard.',
      500,
    );
  }
}

export const POST = withZodBody(adminDashboardPreferencesSchema, handlePost);
