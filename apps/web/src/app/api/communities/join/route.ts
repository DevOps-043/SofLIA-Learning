import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/utils/logger';
import { apiError } from '@/lib/api/errors';
import { withZodBody } from '@/lib/api/with-validation';
import { createClient } from '../../../../lib/supabase/server';

import { joinCommunitySchema, type JoinCommunityBody } from './schema';

async function handlePost(_request: NextRequest, body: JoinCommunityBody) {
  try {
    const supabase = await createClient();

    const { SessionService } = await import('../../../../features/auth/services/session.service');
    const user = await SessionService.getCurrentUser();

    if (!user) {
      return apiError('UNAUTHORIZED', 'No autorizado', 401);
    }

    const { communityId } = body;

    // Verificar que la comunidad existe y es gratuita
    const { data: community, error: communityError } = await supabase
      .from('communities')
      .select(SELECT_COLUMNS.communities)
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
    if (community.slug === 'profesionales') {
      // Verificar si el usuario ya tiene membresía en OTRAS comunidades (excluir Profesionales)
      const { data: allMemberships, error: allMembershipsError } = await supabase
        .from('community_members')
        .select('community_id, communities!inner(name, slug)')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .neq('communities.slug', 'profesionales');

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
    if (community.slug !== 'profesionales') {
      // Buscar la comunidad "Profesionales"
      const { data: profesionalesComm } = await supabase
        .from('communities')
        .select('id, member_count')
        .eq('slug', 'profesionales')
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
    return apiError('JOIN_COMMUNITY_FAILED', 'Error interno del servidor', 500);
  }
}

export const POST = withZodBody(joinCommunitySchema, handlePost);
