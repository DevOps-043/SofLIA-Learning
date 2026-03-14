import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireBusiness } from '@/lib/auth/requireBusiness';
import { logger } from '@/lib/utils/logger';

interface RouteContext {
  params: Promise<{ orgSlug: string }>;
}

/**
 * GET /api/[orgSlug]/business/hierarchy/users/unassigned
 * Lista usuarios sin equipo asignado
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

    const { data: users, error } = await supabase
      .from('organization_users')
      .select(`
        id,
        user_id,
        role,
        status,
        team_id,
        zone_id,
        region_id,
        hierarchy_scope,
        job_title,
        users!inner (
          id,
          username,
          email,
          display_name,
          first_name,
          last_name,
          profile_picture_url
        )
      `)
      .eq('organization_id', auth.organizationId)
      .eq('status', 'active')
      .neq('role', 'owner')
      .is('team_id', null)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Error obteniendo usuarios sin asignar:', error);
      return NextResponse.json(
        { success: false, error: 'Error al obtener usuarios' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      users: users || []
    });
  } catch (error) {
    logger.error('Error en GET /api/[orgSlug]/business/hierarchy/users/unassigned:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener usuarios' },
      { status: 500 }
    );
  }
}
