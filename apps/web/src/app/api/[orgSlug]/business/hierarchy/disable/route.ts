import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireBusiness } from '@/lib/auth/requireBusiness';
import { logger } from '@/lib/utils/logger';

interface RouteContext {
  params: Promise<{ orgSlug: string }>;
}

/**
 * POST /api/[orgSlug]/business/hierarchy/disable
 * Desactiva la jerarquía para la organización
 */
export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const { orgSlug } = await params;
    const auth = await requireBusiness({ organizationSlug: orgSlug });
    if (auth instanceof NextResponse) return auth;

    if (!auth.organizationId) {
      return NextResponse.json(
        { success: false, error: 'No tienes una organización asignada' },
        { status: 403 }
      );
    }

    // Solo el owner o admin puede desactivar la jerarquía
    if (auth.organizationRole !== 'owner' && auth.organizationRole !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Solo el propietario o administrador puede desactivar la jerarquía' },
        { status: 403 }
      );
    }

    const supabase = await createClient();

    // Desactivar la jerarquía
    const { error } = await supabase
      .from('organizations')
      .update({ hierarchy_enabled: false })
      .eq('id', auth.organizationId);

    if (error) {
      logger.error('Error desactivando jerarquía:', error);
      return NextResponse.json(
        { success: false, error: 'Error al desactivar la jerarquía' },
        { status: 500 }
      );
    }

    logger.info('Jerarquía desactivada para organización:', auth.organizationId);

    return NextResponse.json({
      success: true,
      enabled: false,
      message: 'Jerarquía desactivada correctamente'
    });
  } catch (error) {
    logger.error('Error en POST /api/[orgSlug]/business/hierarchy/disable:', error);
    return NextResponse.json(
      { success: false, error: 'Error al desactivar la jerarquía' },
      { status: 500 }
    );
  }
}
