import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/utils/logger';
import { createClient } from '../../../../lib/supabase/server';
import { PROFESIONALES_COMMUNITY_SLUG } from '../community-policy.constants';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Obtener el usuario actual usando el sistema de sesiones personalizado
    const { SessionService } = await import('../../../../features/auth/services/session.service');
    const user = await SessionService.getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }



    const { communityId } = await request.json();

    if (!communityId) {
      return NextResponse.json({ error: 'ID de comunidad requerido' }, { status: 400 });
    }

    // Verificar que la comunidad existe y es gratuita
    const { data: community, error: communityError } = await supabase
      .from('communities')
      .select('*')
      .eq('id', communityId)
      .eq('is_active', true)
      .single();

    if (communityError || !community) {
      return NextResponse.json({ error: 'Comunidad no encontrada' }, { status: 404 });
    }

    if (community.access_type !== 'free') {
      return NextResponse.json({ 
        error: 'Esta comunidad no permite unirse directamente' 
      }, { status: 400 });
    }

    // Lógica especial para "Profesionales"
    if (community.slug === PROFESIONALES_COMMUNITY_SLUG) {
      // Verificar si el usuario ya tiene membresía en OTRAS comunidades (excluir Profesionales)
      const { data: allMemberships, error: allMembershipsError } = await supabase
        .from('community_members')
        .select('community_id, communities!inner(name, slug)')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .neq('communities.slug', PROFESIONALES_COMMUNITY_SLUG);

      if (allMembershipsError) {
        logger.error('Error checking all memberships:', allMembershipsError);
        return NextResponse.json({ error: 'Error al verificar membresías' }, { status: 500 });
      }

      if (allMemberships && allMemberships.length > 0) {
        const otherCommunityNames = allMemberships.map(m => m.communities.name).join(', ');
        return NextResponse.json({ 
          error: `Ya perteneces a otra comunidad: ${otherCommunityNames}` 
        }, { status: 400 });
      }
    }

    // Verificar si el usuario ya es miembro
    const { data: existingMembership, error: membershipError } = await supabase
      .from('community_members')
      .select('id')
      .eq('community_id', communityId)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    if (membershipError && membershipError.code !== 'PGRST116') {
      logger.error('Error checking membership:', membershipError);
      return NextResponse.json({ error: 'Error al verificar membresía' }, { status: 500 });
    }

    if (existingMembership) {
      return NextResponse.json({ error: 'Ya eres miembro de esta comunidad' }, { status: 400 });
    }

    // Si está uniéndose a una comunidad diferente de "Profesionales",
    // remover automáticamente de "Profesionales" si está allí
    if (community.slug !== PROFESIONALES_COMMUNITY_SLUG) {
      // Buscar la comunidad "Profesionales"
      const { data: profesionalesComm } = await supabase
        .from('communities')
        .select('id, member_count')
        .eq('slug', PROFESIONALES_COMMUNITY_SLUG)
        .single();

      if (profesionalesComm) {
        // Verificar si el usuario es miembro de "Profesionales"
        const { data: profMembership } = await supabase
          .from('community_members')
          .select('id')
          .eq('community_id', profesionalesComm.id)
          .eq('user_id', user.id)
          .eq('is_active', true)
          .single();

        if (profMembership) {
          // Remover de "Profesionales"
          const { error: removeError } = await supabase
            .from('community_members')
            .update({ is_active: false, updated_at: new Date().toISOString() })
            .eq('id', profMembership.id);

          if (!removeError) {
            // Decrementar contador de miembros de "Profesionales"
            await supabase
              .from('communities')
              .update({
                member_count: Math.max(0, profesionalesComm.member_count - 1),
                updated_at: new Date().toISOString()
              })
              .eq('id', profesionalesComm.id);

            logger.info(`User ${user.id} automatically removed from Profesionales when joining ${community.name}`);
          }
        }
      }
    }

    // Agregar usuario a la comunidad
    const { error: joinError } = await supabase
      .from('community_members')
      .insert({
        community_id: communityId,
        user_id: user.id,
        role: 'member',
        joined_at: new Date().toISOString(),
        is_active: true
      });

    if (joinError) {
      logger.error('Error joining community:', joinError);
      return NextResponse.json({ error: 'Error al unirse a la comunidad' }, { status: 500 });
    }

    // Actualizar contador de miembros
    const { error: updateError } = await supabase
      .from('communities')
      .update({
        member_count: community.member_count + 1,
        updated_at: new Date().toISOString()
      })
      .eq('id', communityId);

    if (updateError) {
      logger.error('Error updating member count:', updateError);
      // No fallar la operación por esto, solo logear
    }

    return NextResponse.json({
      success: true,
      message: 'Te has unido exitosamente a la comunidad'
    });

  } catch (error) {
    logger.error('Error in join community API:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
