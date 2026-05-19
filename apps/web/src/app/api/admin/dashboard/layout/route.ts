import { NextRequest, NextResponse } from 'next/server';

import { AdminDashboardLayoutService } from '@/features/admin/services/adminDashboardLayout.service';
import { apiError } from '@/lib/api/errors';
import { withZodBody } from '@/lib/api/with-validation';
import { requireAdmin } from '@/lib/auth/requireAdmin';
import { logger } from '@/lib/utils/logger';

import { adminDashboardLayoutSchema, type AdminDashboardLayoutBody } from './schema';

/**
 * GET /api/admin/dashboard/layout
 * Obtener layout personalizado del admin actual
 */
export async function GET(_request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (auth instanceof NextResponse) return auth;

    const layout = await AdminDashboardLayoutService.getLayout(auth.userId);

    return NextResponse.json({ success: true, layout });
  } catch (error) {
    logger.error('Error in dashboard layout GET:', error);
    return apiError(
      'ADMIN_DASHBOARD_LAYOUT_FETCH_FAILED',
      'Error al obtener layout del dashboard.',
      500,
    );
  }
}

/**
 * POST /api/admin/dashboard/layout
 * Guardar/actualizar layout personalizado
 */
async function handlePost(_request: NextRequest, body: AdminDashboardLayoutBody) {
  try {
    const auth = await requireAdmin();
    if (auth instanceof NextResponse) return auth;

    const layout = await AdminDashboardLayoutService.saveLayout(auth.userId, {
      is_default: body.is_default,
      layout_config: body.layout_config,
      name: body.name,
    });

    return NextResponse.json({ success: true, layout });
  } catch (error) {
    logger.error('Error in dashboard layout POST:', error);
    return apiError(
      'ADMIN_DASHBOARD_LAYOUT_SAVE_FAILED',
      'Error al guardar layout del dashboard.',
      500,
    );
  }
}

/**
 * DELETE /api/admin/dashboard/layout
 * Restaurar layout por defecto
 */
export async function DELETE(_request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (auth instanceof NextResponse) return auth;

    await AdminDashboardLayoutService.resetLayout(auth.userId);

    return NextResponse.json({ success: true, message: 'Layout restaurado a valores por defecto' });
  } catch (error) {
    logger.error('Error in dashboard layout DELETE:', error);
    return apiError(
      'ADMIN_DASHBOARD_LAYOUT_RESET_FAILED',
      'Error al restaurar layout.',
      500,
    );
  }
}

export const POST = withZodBody(adminDashboardLayoutSchema, handlePost);
