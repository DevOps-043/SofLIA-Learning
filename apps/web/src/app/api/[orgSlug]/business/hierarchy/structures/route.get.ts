import { NextRequest, NextResponse } from 'next/server';

import { createAdminClient } from '@/lib/supabase/admin';

import { requireBusiness } from '@/lib/auth/requireBusiness';

import { logger } from '@/lib/utils/logger';
import { SELECT_COLUMNS } from '@/lib/supabase/select-types';

interface RouteContext {
  params: Promise<{ orgSlug: string }>;
}

/**
 * GET /api/[orgSlug]/business/hierarchy/structures
 * Obtiene las estructuras jerárquicas de la organización
 */
export async function GET(request: NextRequest, { params }: RouteContext) {
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

    const supabase = createAdminClient();

    const { data: structures, error } = await supabase
      .from('organization_structures')
      .select(SELECT_COLUMNS.organization_structures)
      .eq('organization_id', auth.organizationId)
      .order('is_active', { ascending: false })
      .order('name', { ascending: true });

    if (error) {
      logger.error('Error obteniendo estructuras:', error);
      return NextResponse.json(
        { success: false, error: 'Error al obtener estructuras' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      structures
    });
  } catch (error) {
    logger.error('Error en GET /api/[orgSlug]/business/hierarchy/structures:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener estructuras' },
      { status: 500 }
    );
  }
}
