import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireBusiness } from '@/lib/auth/requireBusiness';
import { logger } from '@/lib/utils/logger';

interface RouteContext {
  params: Promise<{ orgSlug: string }>;
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

    const supabase = await createClient();

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

/**
 * POST /api/[orgSlug]/business/hierarchy/nodes
 * Crea un nuevo nodo en la jerarquía dinámica
 */
export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const { orgSlug } = await params;
    const auth = await requireBusiness({ organizationSlug: orgSlug });
    if (auth instanceof NextResponse) return auth;

    const body = await request.json();
    const supabase = await createClient();

    // 1. Verificar que la estructura pertenece a la organización
    const { data: structure } = await supabase
      .from('organization_structures')
      .select('organization_id')
      .eq('id', body.structure_id)
      .single();

    if (!structure) {
      return NextResponse.json({ error: 'Structure not found' }, { status: 404 });
    }

    if (structure.organization_id !== auth.organizationId) {
      return NextResponse.json({ error: 'Unauthorized access to this structure' }, { status: 403 });
    }

    // 2. Calcular Path y Depth
    let path = '';
    let depth = 0;

    if (body.parent_id) {
      const { data: parent } = await supabase
        .from('organization_nodes')
        .select('path, depth')
        .eq('id', body.parent_id)
        .eq('organization_id', auth.organizationId)
        .single();
      
      if (!parent) return NextResponse.json({ error: 'Parent not found' }, { status: 404 });

      const slug = body.name.toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, '_')
        .replace(/[^a-z0-9_]/g, '');

      path = `${parent.path}.${slug}`;
      depth = parent.depth + 1;
    } else {
      path = 'root';
      depth = 0;
    }

    const { data, error } = await supabase
      .from('organization_nodes')
      .insert({
        ...body,
        organization_id: auth.organizationId,
        path,
        depth
      })
      .select()
      .single();

    if (error) {
      logger.error('Error creando nodo:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    logger.error('Error en POST /api/[orgSlug]/business/hierarchy/nodes:', error);
    return NextResponse.json(
      { success: false, error: 'Error al crear nodo' },
      { status: 500 }
    );
  }
}
