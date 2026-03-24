import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireBusiness } from '@/lib/auth/requireBusiness';
import { logger } from '@/lib/utils/logger';

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

    const supabase = await createClient();

    const { data: structures, error } = await supabase
      .from('organization_structures')
      .select('*')
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

/**
 * POST /api/[orgSlug]/business/hierarchy/structures
 * Crea una nueva estructura jerárquica
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

    const body = await request.json();
    const supabase = await createClient();

    const { data: structure, error } = await supabase
      .from('organization_structures')
      .insert({
        ...body,
        organization_id: auth.organizationId,
        created_by: auth.userId
      })
      .select()
      .single();

    if (error) {
      logger.error('Error creando estructura:', error);
      return NextResponse.json(
        { success: false, error: 'Error al crear estructura' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      structure
    });
  } catch (error) {
    logger.error('Error en POST /api/[orgSlug]/business/hierarchy/structures:', error);
    return NextResponse.json(
      { success: false, error: 'Error al crear estructura' },
      { status: 500 }
    );
  }
}
