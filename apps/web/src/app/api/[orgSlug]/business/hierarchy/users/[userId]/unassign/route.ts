import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireBusiness } from '@/lib/auth/requireBusiness';
import { logger } from '@/lib/utils/logger';

interface RouteContext {
  params: Promise<{ orgSlug: string; userId: string }>;
}

/**
 * POST /api/[orgSlug]/business/hierarchy/users/[userId]/unassign
 * Remueve un usuario de su equipo actual
 */
export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const { orgSlug, userId } = await params;
    const auth = await requireBusiness({ organizationSlug: orgSlug });
    if (auth instanceof NextResponse) return auth;

    if (!auth.organizationId) {
      return NextResponse.json(
        { success: false, error: 'No tienes una organización asignada' },
        { status: 403 }
      );
    }

    // Verificar permisos (owner, admin pueden desasignar)
    if (auth.organizationRole !== 'owner' && auth.organizationRole !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'No tienes permisos para desasignar usuarios' },
        { status: 403 }
      );
    }

    const supabase = await createClient();

    // Verificar que el usuario pertenece a la organización
    const { data: orgUser, error: userError } = await supabase
      .from('organization_users')
      .select('id, role, team_id')
      .eq('user_id', userId)
      .eq('organization_id', auth.organizationId)
      .eq('status', 'active')
      .single();

    if (userError || !orgUser) {
      return NextResponse.json(
        { success: false, error: 'Usuario no encontrado en la organización' },
        { status: 404 }
      );
    }

    if (orgUser.role === 'owner') {
      return NextResponse.json(
        { success: false, error: 'No se puede desasignar al propietario' },
        { status: 400 }
      );
    }

    if (!orgUser.team_id) {
      return NextResponse.json(
        { success: false, error: 'El usuario no está asignado a ningún equipo' },
        { status: 400 }
      );
    }

    // Remover asignación
    const { error: updateError } = await supabase
      .from('organization_users')
      .update({
        team_id: null,
        zone_id: null,
        region_id: null,
        hierarchy_scope: null
      })
      .eq('id', orgUser.id);

    if (updateError) {
      logger.error('Error desasignando usuario:', updateError);
      return NextResponse.json(
        { success: false, error: 'Error al desasignar usuario' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Usuario desasignado correctamente'
    });
  } catch (error) {
    logger.error('Error en POST /api/[orgSlug]/business/hierarchy/users/[userId]/unassign:', error);
    return NextResponse.json(
      { success: false, error: 'Error al desasignar usuario' },
      { status: 500 }
    );
  }
}
