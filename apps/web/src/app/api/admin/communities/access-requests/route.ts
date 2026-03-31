import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '../../../../../lib/supabase/server';
import { logger } from '@/lib/utils/logger';
import { requireAdmin } from '@/lib/auth/requireAdmin'

export async function GET(request: NextRequest) {
  // ✅ SEGURIDAD: Verificar autenticación y autorización de admin
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth

  try {
    const supabase = await createClient();

    // Verificar que el usuario es admin
    const { SessionService } = await import('../../../../../features/auth/services/session.service');
    const user = await SessionService.getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Verificar que el usuario tiene rol de admin
    const { data: userData, error: userError } = await supabase
      .from('usuarios')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userError || userData?.role !== 'admin') {
      return NextResponse.json({ error: 'No tienes permisos de administrador' }, { status: 403 });
    }

    // Obtener todas las solicitudes con información del solicitante y comunidad
    const { data: requests, error: requestsError } = await supabase
      .from('community_access_requests')
      .select(`
        *,
        community:communities (
          name,
          slug
        ),
        requester:usuarios (
          username,
          email,
          first_name,
          last_name
        )
      `)
      .order('created_at', { ascending: false });

    if (requestsError) {
      logger.error('Error fetching access requests:', requestsError);
      return NextResponse.json({ error: 'Error al obtener solicitudes' }, { status: 500 });
    }

    // Calcular estadísticas
    const stats = {
      totalRequests: requests?.length || 0,
      totalPending: requests?.filter(r => r.status === 'pending').length || 0,
      totalApproved: requests?.filter(r => r.status === 'approved').length || 0,
      totalRejected: requests?.filter(r => r.status === 'rejected').length || 0
    };

    return NextResponse.json({
      requests: requests || [],
      stats
    });

  } catch (error) {
    logger.error('Error in admin access requests API:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
