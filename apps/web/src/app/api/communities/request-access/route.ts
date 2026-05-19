import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/utils/logger';
import { apiError } from '@/lib/api/errors';
import { withZodBody } from '@/lib/api/with-validation';
import { createClient } from '../../../../lib/supabase/server';

import { requestCommunityAccessSchema, type RequestCommunityAccessBody } from './schema';

async function handlePost(_request: NextRequest, body: RequestCommunityAccessBody) {
  try {
    const supabase = await createClient();

    const { SessionService } = await import('../../../../features/auth/services/session.service');
    const user = await SessionService.getCurrentUser();

    if (!user) {
      return apiError('UNAUTHORIZED', 'No autorizado', 401);
    }

    const { communityId, note } = body;

    // Verificar que la comunidad existe y requiere invitación
    const { data: community, error: communityError } = await supabase
      .from('communities')
      .select(SELECT_COLUMNS.communities)
      .eq('id', communityId)
      .eq('is_active', true)
      .single();

    if (communityError || !community) {
      return NextResponse.json({ error: 'Comunidad no encontrada' }, { status: 404 });
    }

    // Solo permitir solicitudes si el tipo de acceso requiere aprobación
    // Los valores permitidos son: 'open', 'closed', 'invite_only', 'request'
    // Solo 'request' requiere solicitud explícita, pero también aceptamos 'closed' e 'invite_only'
    if (community.access_type === 'open') {
      return NextResponse.json({ 
        error: 'Esta comunidad permite unirse directamente' 
      }, { status: 400 });
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

    // Verificar si ya existe una solicitud pendiente
    const { data: existingRequest, error: requestError } = await supabase
      .from('community_access_requests')
      .select('id')
      .eq('community_id', communityId)
      .eq('requester_id', user.id)
      .eq('status', 'pending')
      .single();

    if (requestError && requestError.code !== 'PGRST116') {
      logger.error('Error checking existing request:', requestError);
      return NextResponse.json({ error: 'Error al verificar solicitud existente' }, { status: 500 });
    }

    if (existingRequest) {
      return NextResponse.json({ 
        error: 'Ya tienes una solicitud pendiente para esta comunidad' 
      }, { status: 400 });
    }

    // Crear solicitud de acceso
    const { data: newRequest, error: createRequestError } = await supabase
      .from('community_access_requests')
      .insert({
        community_id: communityId,
        requester_id: user.id,
        status: 'pending',
        note: note || null,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (createRequestError || !newRequest) {
      logger.error('Error creating access request:', createRequestError);
      return NextResponse.json({ error: 'Error al crear solicitud de acceso' }, { status: 500 });
    }

    // Crear notificaciones solo para usuarios autorizados (Administradores e Instructores que pueden gestionar)
    try {
      const { getUsersToNotifyForAccessRequest } = await import('../../../../lib/auth/communityPermissions');
      const { NotificationService } = await import('../../../../features/notifications/services/notification.service');

      const userIdsToNotify = await getUsersToNotifyForAccessRequest(communityId);
      
      logger.info(`📬 Creando notificaciones para ${userIdsToNotify.length} usuarios autorizados`);
      
      // Si no hay usuarios para notificar, registrar un warning pero continuar
      if (userIdsToNotify.length === 0) {
        logger.warn(`⚠️ No hay usuarios autorizados para notificar sobre la solicitud de acceso a la comunidad ${communityId}`);
      } else {
        // Obtener información del solicitante para la notificación
        const requesterName = user.display_name || user.first_name || user.username || 'Un usuario';
        
        // Crear notificaciones para cada usuario autorizado
        let notificationsCreated = 0;
        for (const userId of userIdsToNotify) {
          try {
            await NotificationService.createNotification({
              userId,
              notificationType: 'community_access_request',
              title: 'Nueva solicitud de acceso a comunidad',
              message: `${requesterName} ha solicitado acceso a la comunidad "${community.name}"`,
              metadata: {
                community_id: communityId,
                community_name: community.name,
                request_id: newRequest.id,
                requester_id: user.id,
                requester_name: requesterName,
                timestamp: new Date().toISOString()
              },
              priority: 'medium'
            });
            notificationsCreated++;
          } catch (userNotificationError) {
            logger.error(`Error creating notification for user ${userId}:`, userNotificationError);
            // Continuar con el siguiente usuario aunque falle uno
          }
        }
        
        logger.info(`✅ Notificaciones creadas: ${notificationsCreated}/${userIdsToNotify.length}`);
      }
    } catch (notificationError) {
      // No fallar la operación si hay error en notificaciones, pero registrar el error
      logger.error('Error creating notifications for access request:', notificationError);
      // Log del stack trace si está disponible
      if (notificationError instanceof Error) {
        logger.error('Notification error stack:', notificationError.stack);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Solicitud de acceso enviada exitosamente'
    });

  } catch (error) {
    logger.error('Error in request access API:', error);
    return apiError('REQUEST_ACCESS_FAILED', 'Error interno del servidor', 500);
  }
}

export const POST = withZodBody(requestCommunityAccessSchema, handlePost);
