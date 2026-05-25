import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';

import { requireBusiness } from '@/lib/auth/requireBusiness';

import { logger } from '@/lib/utils/logger';

/**
 * GET /api/business/hierarchy/config
 * Obtiene la configuración de jerarquía de la organización
 */
export async function GET() {
  try {
    const auth = await requireBusiness();
    if (auth instanceof NextResponse) return auth;

    if (!auth.organizationId) {
      return NextResponse.json(
        { success: false, error: 'No tienes una organización asignada' },
        { status: 403 }
      );
    }

    const supabase = await createClient();

    const { data: org, error } = await supabase
      .from('organizations')
      .select('id, hierarchy_enabled, hierarchy_config')
      .eq('id', auth.organizationId)
      .single();

    if (error || !org) {
      logger.error('Error obteniendo config de jerarquía:', error);
      return NextResponse.json(
        { success: false, error: 'Organización no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      config: {
        hierarchy_enabled: org.hierarchy_enabled ?? false,
        ...(org.hierarchy_config as object || {})
      }
    });
  } catch (error) {
    logger.error('Error en GET /api/business/hierarchy/config:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener configuración' },
      { status: 500 }
    );
  }
}
