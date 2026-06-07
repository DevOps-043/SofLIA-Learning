import { NextRequest, NextResponse } from 'next/server';

import { createAdminClient } from '@/lib/supabase/admin';

import { requireBusiness } from '@/lib/auth/requireBusiness';

import { logger } from '@/lib/utils/logger';

interface RouteContext {
  params: Promise<{ orgSlug: string }>;
}

interface CreateNodeRequest {
  structure_id: string;
  parent_id?: string | null;
  name: string;
  type: string;
  position?: number | null;
  manager_id?: string | null;
  properties?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
}

/**
 * GET /api/[orgSlug]/business/hierarchy/nodes
 * Lista los nodos de una estructura
 */
export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const { orgSlug } = await params;
    const auth = await requireBusiness({ organizationSlug: orgSlug });
    if (auth instanceof NextResponse) return auth;

    const { searchParams } = new URL(request.url);
    const structureId = searchParams.get('structureId');

    if (!structureId) {
      return NextResponse.json({ error: 'Structure ID required' }, { status: 400 });
    }

    const supabase = createAdminClient();

    const { data: nodes, error } = await supabase
      .from('organization_nodes')
      .select(`
        *,
        manager:manager_id (
          id, first_name, last_name, email, profile_picture_url
        )
      `)
      .eq('organization_id', auth.organizationId)
      .eq('structure_id', structureId)
      .order('depth')
      .order('position');

    if (error) {
      logger.error('Error obteniendo nodos:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, nodes });
  } catch (error) {
    logger.error('Error en GET /api/[orgSlug]/business/hierarchy/nodes:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener nodos' },
      { status: 500 }
    );
  }
}
